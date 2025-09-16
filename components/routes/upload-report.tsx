'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseExcelFile, parseCSVFile, transformToAssignedLoad, getTomorrowDayName } from '@/lib/utils/file-parser';
import { createAssignedLoads, deleteAssignedLoadsByDay, createRouteFromAssignedLoad } from '@/lib/actions/assigned-loads';
import { logRouteTimingData } from '@/lib/actions/route-timing';
import { useToast } from '@/hooks/use-toast';

interface UploadReportProps {
  onUploadComplete?: () => void;
}

export function UploadReport({ onUploadComplete }: UploadReportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    processed: number;
    rejected: number;
    stored: number;
    routesCreated: number;
    timingLogsCreated: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadStats(null);
    setIsUploading(true);

    try {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        throw new Error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      }

      // Parse the file
      let parsedData;
      if (fileExtension === 'csv') {
        parsedData = await parseCSVFile(file);
      } else {
        parsedData = await parseExcelFile(file);
      }

      if (!parsedData || parsedData.length === 0) {
        throw new Error('No data found in the file');
      }

      // Debug: Show all available columns in the first row
      if (parsedData.length > 0) {
        console.log('Available columns in your Excel file:', Object.keys(parsedData[0]));
        console.log('First row sample data:', parsedData[0]);
        
        // Check specifically for reject fault columns
        const firstRow = parsedData[0];
        console.log('Reject fault related columns found:', {
          'reject_fault': firstRow['reject_fault'],
          'Reject Fault': firstRow['Reject Fault'],
          'reject fault': firstRow['reject fault'],
          'REJECT_FAULT': firstRow['REJECT_FAULT'],
          'RejectFault': firstRow['RejectFault']
        });
      }

      // Get tomorrow's day name
      const targetDay = getTomorrowDayName();
      
      // Transform and filter data - only CIT ERROR rejections
      const assignedLoads = [];
      const citErrorLoads = [];
      let rejectedCount = 0;
      let routesCreated = 0;
      const uniqueRejectFaults = new Set();

      for (const row of parsedData) {
        const rejectFault = row['Reject Fault']?.toString()?.toUpperCase();
        
        // Only process CIT ERROR rejections
        if (rejectFault === 'CIT ERROR') {
          const assignedLoad = transformToAssignedLoad(row, targetDay);
          assignedLoads.push(assignedLoad);
          citErrorLoads.push({
            load: assignedLoad,
            routeName: row['Route Name']?.toString() || 'Unknown Route'
          });
        } else {
          rejectedCount++;
        }
        
        if (rejectFault) {
          uniqueRejectFaults.add(rejectFault);
        }
      }

      // Clear existing data for the target day
      await deleteAssignedLoadsByDay(targetDay);

      // Store the new data (only CIT ERROR records)
      let timingLogsCreated = 0;
      if (assignedLoads.length > 0) {
        const createdLoads = await createAssignedLoads(assignedLoads);
        
        // Create routes for tomorrow for each CIT ERROR load
        for (let i = 0; i < createdLoads.length; i++) {
          const createdLoad = createdLoads[i];
          const citErrorLoad = citErrorLoads[i];
          
          try {
            await createRouteFromAssignedLoad(
              createdLoad.id, 
              citErrorLoad.routeName, 
              targetDay
            );
            routesCreated++;
          } catch (error) {
            console.error('Error creating route for load:', createdLoad.id, error);
          }
        }

        // Log route timing data for all assigned routes
        try {
          console.log('🕒 Logging route timing data...');
          const timingResult = await logRouteTimingData();
          
          if (timingResult.success) {
            timingLogsCreated = timingResult.data?.length || 0;
            console.log(`✅ Route timing data logged for ${timingLogsCreated} routes`);
          } else {
            console.error('❌ Failed to log route timing data:', timingResult.error);
          }
        } catch (error) {
          console.error('❌ Error logging route timing data:', error);
        }
      }

      // Update stats
      setUploadStats({
        total: parsedData.length,
        processed: assignedLoads.length,
        rejected: rejectedCount,
        stored: assignedLoads.length,
        routesCreated: routesCreated,
        timingLogsCreated: timingLogsCreated
      });

      setUploadStatus('success');
      setUploadMessage(
        `Upload completed for ${targetDay}: ${assignedLoads.length} CIT ERROR records stored, ${routesCreated} routes created for tomorrow, and ${timingLogsCreated} route timing logs created. ${rejectedCount} non-CIT ERROR records skipped.`
      );

      // Show success toast
      toast({
        title: "Upload Successful",
        description: `Processed ${assignedLoads.length} CIT ERROR records and created ${routesCreated} routes for tomorrow. Route timing data logged for ${timingLogsCreated} routes.`,
        variant: "default",
      });

      // Call the callback if provided
      onUploadComplete?.();

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      
      // Show error toast
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Report
            </>
          )}
        </Button>
      </div>

      {/* Upload Status */}
      {uploadStatus !== 'idle' && (
        <Alert variant={uploadStatus === 'success' ? 'default' : 'destructive'}>
          {uploadStatus === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <AlertDescription>{uploadMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload Stats */}
      {uploadStats && (
        <div className="bg-gray-50 p-4 border rounded-lg">
          <h4 className="mb-2 font-medium text-gray-700 text-sm">Upload Summary</h4>
          <div className="gap-4 grid grid-cols-2 text-sm">
            <div>
              <span className="text-gray-600">Total Records:</span>
              <span className="ml-2 font-medium">{uploadStats.total}</span>
            </div>
            <div>
              <span className="text-gray-600">CIT ERROR Records:</span>
              <span className="ml-2 font-medium text-orange-600">{uploadStats.processed}</span>
            </div>
            <div>
              <span className="text-gray-600">Skipped (Non-CIT):</span>
              <span className="ml-2 font-medium text-red-600">{uploadStats.rejected}</span>
            </div>
            <div>
              <span className="text-gray-600">Routes Created:</span>
              <span className="ml-2 font-medium text-green-600">{uploadStats.routesCreated}</span>
            </div>
            <div>
              <span className="text-gray-600">Timing Logs Created:</span>
              <span className="ml-2 font-medium text-blue-600">{uploadStats.timingLogsCreated}</span>
            </div>
            <div>
              <span className="text-gray-600">Records Stored:</span>
              <span className="ml-2 font-medium text-purple-600">{uploadStats.stored}</span>
            </div>
          </div>
        </div>
      )}

      {/* File Format Info */}
      <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 w-4 h-4 text-blue-600" />
          <div className="text-blue-800 text-sm">
            <p className="font-medium">Supported File Formats</p>
            <p className="text-blue-600">
              Upload CSV or Excel files (.csv, .xlsx, .xls) with the required headers. 
              Only records with "CIT ERROR" reject fault will be processed and routes created for tomorrow.
              Route timing data will be automatically logged for performance analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
