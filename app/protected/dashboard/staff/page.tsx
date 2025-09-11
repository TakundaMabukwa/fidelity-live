'use client';

import React from 'react';
import { StatsCard } from '@/components/common/stats-card';
import { StaffTable } from '@/components/staff/staff-table';
import { useStaff } from '@/contexts/staff-context';
import { UserCheck, Users, Phone, Briefcase } from 'lucide-react';

export default function StaffPage() {
  const { staff } = useStaff();

  // Calculate real stats from actual data
  const totalStaff = staff.length;
  const withCompanyNo = staff.filter(staffMember => staffMember.comp_no).length;
  const withFullNames = staff.filter(staffMember => staffMember.full_names).length;
  const withCellPhone = staff.filter(staffMember => staffMember.cell).length;

  // Group by job description
  const jobDescriptionGroups = staff.reduce((acc, staffMember) => {
    const jobDesc = staffMember.job_description_remarks || 'No Description';
    acc[jobDesc] = (acc[jobDesc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top job descriptions
  const topJobDescriptions = Object.entries(jobDescriptionGroups)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  const stats = [
    { 
      title: 'Total Staff', 
      value: totalStaff.toString(), 
      color: 'blue' as const, 
      icon: <UserCheck className="w-5 h-5" /> 
    },
    { 
      title: 'With Company No', 
      value: withCompanyNo.toString(), 
      color: 'green' as const, 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      title: 'With Full Names', 
      value: withFullNames.toString(), 
      color: 'orange' as const, 
      icon: <Phone className="w-5 h-5" /> 
    },
    { 
      title: 'With Cell Phone', 
      value: withCellPhone.toString(), 
      color: 'purple' as const, 
      icon: <Briefcase className="w-5 h-5" /> 
    },
  ];

  // Add job description stats
  const jobStats = topJobDescriptions.map(([jobDesc, count], index) => {
    const colors = ['blue', 'green', 'orange', 'purple'] as const;
    const icons = [UserCheck, Users, Phone, Briefcase];
    const Icon = icons[index % icons.length];
    
    return {
      title: jobDesc.length > 20 ? `${jobDesc.substring(0, 20)}...` : jobDesc,
      value: count.toString(),
      color: colors[index % colors.length],
      icon: <Icon className="w-5 h-5" />
    };
  });

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="flex-shrink-0">
        <h1 className="font-bold text-slate-800 text-3xl">STAFF</h1>
        <p className="mt-1 text-gray-600">
          Manage and monitor staff information and assignments
        </p>
      </div>

      {/* Basic Stats */}
      <div className="flex-shrink-0 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Job Description Stats */}
      {jobStats.length > 0 && (
        <div className="flex-shrink-0">
          <h2 className="mb-4 font-semibold text-gray-700 text-lg">Staff by Job Description</h2>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {jobStats.map((stat, index) => (
              <StatsCard key={`job-${index}`} {...stat} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <StaffTable />
      </div>
    </div>
  );
}
