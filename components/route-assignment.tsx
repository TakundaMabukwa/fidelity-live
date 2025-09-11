"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Package } from "lucide-react"
import { User, GripVertical, Users } from "lucide-react"

interface Driver {
  id: string
  name: string
  surname: string
  initial: string
  available: boolean
}

interface Crewman {
  id: string
  name: string
  surname: string
  initial: string
  available: boolean
}

interface VehicleInfo {
  structureName: string
  registrationNo: string
  fleetNo: string
}

interface Vehicle {
  vehicle_id: string
  total_assigned_kg: number
  assigned_load_count: number
  loads: Load[]
  capacity_kg?: number
  vehicleInfo?: VehicleInfo
  assignedDriver?: Driver
  assignedCrew?: Crewman
}

interface Load {
  load_id: string
  route_id: string
  route_name: string
  branch_name: string
  required_kg: number
  required_length_mm: number
  assm_load: boolean
  zones: string[]
  orders: Order[]
}

interface Order {
  order_id: string
  sales_order_number: string
  customer_name: string
  order_status: string
  total_weight: number
  items: Item[]
}

interface Item {
  id: string
  description: string
  quantity: number
  weight: number
  length: string
  customer_name: string
  sales_order_no: string
}

interface Route {
  route_id: string
  route_name: string
  vehicles: Vehicle[]
}

const driversData: Driver[] = [
  { id: "d1", name: "SAMBO", surname: "HANYANI", initial: "H", available: true },
  { id: "d2", name: "MARINGA", surname: "PIKANI", initial: "P", available: true },
  { id: "d3", name: "NDEBELE", surname: "QINISO", initial: "Q", available: true },
  { id: "d4", name: "SIBANDA", surname: "LOGAN", initial: "L", available: true },
]

const crewData: Crewman[] = [
  { id: "c1", name: "GUMBANE", surname: "PIET", initial: "P", available: true },
  { id: "c2", name: "FREESE", surname: "HERMAN", initial: "H", available: true },
]

const logisticsData = {
  assignments_by_vehicle: [
    {
      vehicle_id: "7d6ce211-0574-4445-ab48-7663254643aa",
      total_assigned_kg: 35701.817,
      assigned_load_count: 4,
      capacity_kg: 40000,
      vehicleInfo: {
        structureName: "TRUCK-001",
        registrationNo: "ABC123GP",
        fleetNo: "FL001",
      },
      loads: [
        {
          load_id: "876f8cb9-2b9b-400d-8581-4bf0683c85ac",
          route_id: "0056e30e-a9e1-421e-b16f-1a26633b3123",
          route_name: "ALBERTON",
          branch_name: "Allied Steelrode (Pty) Ltd Head Office",
          required_kg: 10616.273,
          required_length_mm: 6600,
          assm_load: true,
          zones: ["ALBERTON"],
          orders: [
            {
              order_id: "83db567b-e1ec-4590-b7e1-21ef7df871d7",
              sales_order_number: "7182158",
              customer_name: "ALBERTON STEEL & PIPE",
              order_status: "Sales Order Open Printed",
              total_weight: 1560.06,
              items: [
                {
                  id: "90883a82-ee24-4972-97ad-78e8d737809f",
                  description: "SHS 3.00X1200X2500 VASTRAP",
                  quantity: 20,
                  weight: 1560.06,
                  length: "0",
                  customer_name: "ALBERTON STEEL & PIPE",
                  sales_order_no: "7182158",
                },
              ],
            },
            {
              order_id: "2e49d149-6f5a-47ae-837f-5a4c1ddb04e6",
              sales_order_number: "7182159",
              customer_name: "ALBERTON STEEL & PIPE",
              order_status: "Sales Order Open Printed",
              total_weight: 780.03,
              items: [
                {
                  id: "a94330e2-4f03-4586-899c-df9615fd1632",
                  description: "SHS 3.00X1200X2500 VASTRAP",
                  quantity: 10,
                  weight: 780.03,
                  length: "0",
                  customer_name: "ALBERTON STEEL & PIPE",
                  sales_order_no: "7182159",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      vehicle_id: "20cd4b90-db47-4e9d-8cad-34e2b2e373e6",
      total_assigned_kg: 32850.545,
      assigned_load_count: 3,
      capacity_kg: 35000,
      vehicleInfo: {
        structureName: "TRUCK-002",
        registrationNo: "DEF456GP",
        fleetNo: "FL002",
      },
      loads: [
        {
          load_id: "11cfada4-e0a1-448e-9a36-736567793fe1",
          route_id: "f16dfbb1-9413-4143-8c4f-228e9ed07a08",
          route_name: "CENTURION SOUTH",
          branch_name: "Allied Steelrode (Pty) Ltd Head Office",
          required_kg: 5575.499,
          required_length_mm: 600,
          assm_load: false,
          zones: ["PRETORIA"],
          orders: [
            {
              order_id: "434779c2-cc08-40a1-b757-d1744ed1f34f",
              sales_order_number: "339592",
              customer_name: "ELCOR PROJECTS CASH SALE",
              order_status: "Sales Order Open Printed",
              total_weight: 5575.499,
              items: [
                {
                  id: "f7ecb578-e8f4-4c9f-be01-69faa4167b9f",
                  description: "BM 356X171X45X11.000 S355",
                  quantity: 8,
                  weight: 3960,
                  length: "0",
                  customer_name: "ELCOR PROJECTS CASH SALE",
                  sales_order_no: "339592",
                },
                {
                  id: "6701ca4d-64bb-4a1e-b715-df62bb390559",
                  description: "IP 200X100X17.95X9M IPE-AA-S355JR+AR",
                  quantity: 10,
                  weight: 1615.499,
                  length: "0",
                  customer_name: "ELCOR PROJECTS CASH SALE",
                  sales_order_no: "339592",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      vehicle_id: "3cd6b1c2-033d-42f4-9c9c-8898cb2794b7",
      total_assigned_kg: 36108.63,
      assigned_load_count: 1,
      capacity_kg: 40000,
      vehicleInfo: {
        structureName: "TRUCK-003",
        registrationNo: "GHI789GP",
        fleetNo: "FL003",
      },
      loads: [
        {
          load_id: "4a262cb8-045f-49aa-bce6-a1d7809f69d4",
          route_id: "e7489145-7f6e-4f85-9724-7084abd8a663",
          route_name: "CENTURION WEST",
          branch_name: "Allied Steelrode (Pty) Ltd Head Office",
          required_kg: 36108.63,
          required_length_mm: 600,
          assm_load: true,
          zones: ["HENNOPSPARK"],
          orders: [
            {
              order_id: "7f2ab259-04b8-41ca-b555-0f481253c40f",
              sales_order_number: "339646",
              customer_name: "PARKTOWN MANUFACTURERS (PTY) LTD",
              order_status: "Sales Order Open Printed",
              total_weight: 3860.321,
              items: [
                {
                  id: "a9cc1660-db98-4fcf-96b3-eaaf5b2d78a0",
                  description: "CS 1.00X1225X2450 CQ",
                  quantity: 160,
                  weight: 3860.321,
                  length: "0",
                  customer_name: "PARKTOWN MANUFACTURERS (PTY) LTD",
                  sales_order_no: "339646",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      vehicle_id: "25243efa-d24e-424c-912a-e336b96ef440",
      total_assigned_kg: 236321.952,
      assigned_load_count: 3,
      capacity_kg: 250000,
      vehicleInfo: {
        structureName: "TRUCK-004",
        registrationNo: "JKL012GP",
        fleetNo: "FL004",
      },
      loads: [
        {
          load_id: "5f0c1a55-34c8-43fe-936f-b8271330eb03",
          route_id: "b3ff875a-df4e-448b-9df3-f627881d7e89",
          route_name: "EAST RAND 01",
          branch_name: "Allied Steelrode (Pty) Ltd Head Office",
          required_kg: 231840.55,
          required_length_mm: 600,
          assm_load: true,
          zones: ["3KESWICKROAD", "GERIMSTON"],
          orders: [
            {
              order_id: "072351a3-cacc-4eb5-8ec7-bfc555fd57c7",
              sales_order_number: "339562",
              customer_name: "STEWARTS & LLOYDS HOLDINGS (PTY) LTD",
              order_status: "Sales Order Open Printed",
              total_weight: 21460,
              items: [
                {
                  id: "c74241cb-eb38-4114-aa83-03100b9643e5",
                  description: "CC 1.16X1225 CQ",
                  quantity: 21460,
                  weight: 21460,
                  length: "0",
                  customer_name: "STEWARTS & LLOYDS HOLDINGS (PTY) LTD",
                  sales_order_no: "339562",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const generateAvailableItems = (): Item[] => {
  const availableItems: Item[] = [
    {
      id: "item-001",
      description: "SHS 4.00X1500X3000 CQ",
      quantity: 25,
      weight: 2850.5,
      length: "3000",
      customer_name: "MANUAL ASSIGNMENT",
      sales_order_no: "NEW-001",
    },
    {
      id: "item-002",
      description: "BM 406X178X54X12.000 S355",
      quantity: 12,
      weight: 4200.8,
      length: "12000",
      customer_name: "MANUAL ASSIGNMENT",
      sales_order_no: "NEW-002",
    },
    {
      id: "item-003",
      description: "IP 300X150X37.2X12M IPE-AA-S355JR+AR",
      quantity: 8,
      weight: 3576.2,
      length: "12000",
      customer_name: "MANUAL ASSIGNMENT",
      sales_order_no: "NEW-003",
    },
    {
      id: "item-004",
      description: "CS 2.00X1225X2450 CQ",
      quantity: 200,
      weight: 9580.4,
      length: "2450",
      customer_name: "MANUAL ASSIGNMENT",
      sales_order_no: "NEW-004",
    },
    {
      id: "item-005",
      description: "SHS 3.50X1200X2500 VASTRAP",
      quantity: 15,
      weight: 1872.15,
      length: "2500",
      customer_name: "MANUAL ASSIGNMENT",
      sales_order_no: "NEW-005",
    },
  ]
  return availableItems
}

export default function LogisticsDashboard() {
  const [currentView, setCurrentView] = useState<"routes" | "vehicles" | "assignment" | "loading">("routes")
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>(logisticsData.assignments_by_vehicle)
  const [drivers, setDrivers] = useState<Driver[]>(driversData)
  const [crew, setCrew] = useState<Crewman[]>(crewData)

  const [draggedItem, setDraggedItem] = useState<Item | null>(null)
  const [draggedFromVehicle, setDraggedFromVehicle] = useState<boolean>(false)
  const [availableItems] = useState<Item[]>(generateAvailableItems())

  const [draggedDriver, setDraggedDriver] = useState<Driver | null>(null)
  const [draggedCrew, setDraggedCrew] = useState<Crewman | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [dragOverZone, setDragOverZone] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; item: any } | null>(null)

  const routes: Route[] = React.useMemo(() => {
    const routeMap = new Map<string, Route>()

    vehicles.forEach((vehicle) => {
      vehicle.loads.forEach((load) => {
        if (!routeMap.has(load.route_id)) {
          routeMap.set(load.route_id, {
            route_id: load.route_id,
            route_name: load.route_name,
            vehicles: [],
          })
        }
        const route = routeMap.get(load.route_id)!
        if (!route.vehicles.find((v) => v.vehicle_id === vehicle.vehicle_id)) {
          route.vehicles.push(vehicle)
        }
      })
    })

    return Array.from(routeMap.values())
  }, [vehicles])

  const getVehicleUtilization = (vehicle: Vehicle) => {
    const capacity = vehicle.capacity_kg || 40000
    return Math.round((vehicle.total_assigned_kg / capacity) * 100)
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-400"
    if (percentage >= 70) return "bg-orange-400"
    if (percentage >= 40) return "bg-yellow-400"
    return "bg-green-400"
  }

  const assignDriverToVehicle = (driver: Driver, vehicle: Vehicle) => {
    const updatedVehicles = vehicles.map((v) => {
      if (v.vehicle_id === vehicle.vehicle_id) {
        return { ...v, assignedDriver: driver }
      }
      // Remove driver from other vehicles
      if (v.assignedDriver?.id === driver.id) {
        return { ...v, assignedDriver: undefined }
      }
      return v
    })

    const updatedDrivers = drivers.map((d) => ({
      ...d,
      available: d.id === driver.id ? false : updatedVehicles.some((v) => v.assignedDriver?.id === d.id) ? false : true,
    }))

    setVehicles(updatedVehicles)
    setDrivers(updatedDrivers)
    setSelectedVehicle(updatedVehicles.find((v) => v.vehicle_id === vehicle.vehicle_id) || null)
  }

  const assignCrewToVehicle = (crewman: Crewman, vehicle: Vehicle) => {
    const updatedVehicles = vehicles.map((v) => {
      if (v.vehicle_id === vehicle.vehicle_id) {
        return { ...v, assignedCrew: crewman }
      }
      // Remove crew from other vehicles
      if (v.assignedCrew?.id === crewman.id) {
        return { ...v, assignedCrew: undefined }
      }
      return v
    })

    const updatedCrew = crew.map((c) => ({
      ...c,
      available: c.id === crewman.id ? false : updatedVehicles.some((v) => v.assignedCrew?.id === c.id) ? false : true,
    }))

    setVehicles(updatedVehicles)
    setCrew(updatedCrew)
    setSelectedVehicle(updatedVehicles.find((v) => v.vehicle_id === vehicle.vehicle_id) || null)
  }

  const handleDragStart = (e: React.DragEvent, item: Item) => {
    setDraggedItem(item)
    setSelectedItem(item)
    setDraggedFromVehicle(false)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"

    // Create enhanced drag image with smooth styling
    const dragImage = document.createElement("div")
    dragImage.innerHTML = `
    <div style="
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      transform: rotate(3deg) scale(1.05);
      font-size: 14px;
      max-width: 200px;
      opacity: 0.95;
    ">
      <div style="font-weight: 600; color: #1f2937;">${item.description.substring(0, 30)}...</div>
      <div style="color: #6b7280; font-size: 12px;">${item.weight}kg</div>
    </div>
  `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 30)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleVehicleItemDragStart = (e: React.DragEvent, item: Item) => {
    setDraggedItem(item)
    setSelectedItem(item)
    setDraggedFromVehicle(true)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"

    // Enhanced drag image for vehicle items
    const dragImage = document.createElement("div")
    dragImage.innerHTML = `
    <div style="
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      transform: rotate(-2deg) scale(1.05);
      font-size: 14px;
      max-width: 200px;
      opacity: 0.95;
    ">
      <div style="font-weight: 600; color: #92400e;">${item.description.substring(0, 30)}...</div>
      <div style="color: #d97706; font-size: 12px;">${item.weight}kg</div>
    </div>
  `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 30)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handlePersonnelDragStart = (e: React.DragEvent, person: Driver | Crewman, type: "driver" | "crew") => {
    if (type === "driver") {
      setDraggedDriver(person as Driver)
    } else {
      setDraggedCrew(person as Crewman)
    }
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"

    // Enhanced drag image for personnel
    const dragImage = document.createElement("div")
    const bgColor = type === "driver" ? "#dbeafe" : "#dcfce7"
    const borderColor = type === "driver" ? "#3b82f6" : "#22c55e"
    const textColor = type === "driver" ? "#1e40af" : "#166534"

    dragImage.innerHTML = `
    <div style="
      background: ${bgColor};
      border: 2px solid ${borderColor};
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      transform: rotate(1deg) scale(1.05);
      font-size: 14px;
      max-width: 180px;
      opacity: 0.95;
    ">
      <div style="font-weight: 600; color: ${textColor};">${person.name} ${person.surname}</div>
      <div style="color: ${textColor}; font-size: 12px; opacity: 0.8;">${type === "driver" ? "Driver" : "Crew Member"}</div>
    </div>
  `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 90, 25)
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  const handleDragEnd = () => {
    setTimeout(() => {
      setIsDragging(false)
      setDragPosition(null)
      setSelectedItem(null)
      setDraggedItem(null)
      setDraggedDriver(null)
      setDraggedCrew(null)
      setDragOverZone(null)
      setDragPreview(null)
    }, 100) // Small delay for smoother transition
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDragPosition({ x: e.clientX, y: e.clientY })

    // Enhanced preview for dragged items
    if (draggedItem) {
      setDragPreview({
        x: e.clientX,
        y: e.clientY,
        item: draggedItem,
      })
    }
  }

  const handleZoneDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverZone(zone)
    setDragPosition({ x: e.clientX, y: e.clientY })
  }

  const handleZoneDragLeave = () => {
    setDragOverZone(null)
  }

  const TruckVisualization = ({
    selectedVehicle,
    onPersonnelDrop,
  }: {
    selectedVehicle: Vehicle | null
    onPersonnelDrop?: (e: React.DragEvent, zone: string) => void
  }) => {
    return (
      <div className="bg-white p-6 border rounded-lg">
        <svg width="400" height="300" viewBox="0 0 400 300" className="mx-auto">
          {/* Truck cab with rounded corners and detail lines */}
          <g className="transition-all duration-300">
            {/* Main cab body */}
            <path
              d="M 150 40 L 250 40 Q 270 40 270 60 L 270 100 Q 270 120 250 120 L 150 120 Q 130 120 130 100 L 130 60 Q 130 40 150 40 Z"
              fill={selectedVehicle?.assignedDriver ? "#dbeafe" : "#f9fafb"}
              stroke={selectedVehicle?.assignedDriver ? "#3b82f6" : "#9ca3af"}
              strokeWidth="2"
              strokeDasharray={selectedVehicle?.assignedDriver ? "0" : "5,5"}
              className={`cursor-pointer transition-all duration-300 ${
                dragOverZone === "driver"
                  ? "fill-blue-100 stroke-blue-500 drop-shadow-lg"
                  : "hover:fill-blue-50 hover:drop-shadow-md"
              }`}
              onDragOver={(e) => handleZoneDragOver(e, "driver")}
              onDragLeave={handleZoneDragLeave}
              onDrop={(e) => onPersonnelDrop?.(e, "driver")}
            />

            {/* Cab detail lines */}
            <line x1="150" y1="50" x2="250" y2="50" stroke="#9ca3af" strokeWidth="1" />
            <line x1="150" y1="110" x2="250" y2="110" stroke="#9ca3af" strokeWidth="1" />
            <line x1="200" y1="40" x2="200" y2="120" stroke="#9ca3af" strokeWidth="1" />

            {/* Driver icon and label */}
            {selectedVehicle?.assignedDriver && (
              <g className="transition-all duration-300">
                <circle cx="200" cy="80" r="15" fill="#3b82f6" className="drop-shadow-sm" />
                <text x="200" y="85" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">
                  {selectedVehicle.assignedDriver.name.charAt(0)}
                </text>
                <text x="200" y="105" textAnchor="middle" fontSize="10" fill="#1f2937" fontWeight="bold">
                  {selectedVehicle.assignedDriver.name}
                </text>
              </g>
            )}
          </g>

          {/* Trailer with compartments matching the design */}
          <g className="transition-all duration-300">
            {/* Main trailer body with rounded corners */}
            <rect x="80" y="140" width="240" height="120" fill="#f9fafb" stroke="#d1d5db" strokeWidth="2" rx="15" />

            {/* Compartment dividers */}
            <line x1="140" y1="150" x2="140" y2="250" stroke="#d1d5db" strokeWidth="2" />
            <line x1="200" y1="150" x2="200" y2="250" stroke="#d1d5db" strokeWidth="2" />
            <line x1="260" y1="150" x2="260" y2="250" stroke="#d1d5db" strokeWidth="2" />

            {/* Crew section 1 */}
            <rect
              x="90"
              y="155"
              width="40"
              height="90"
              fill={selectedVehicle?.assignedCrew ? "#dcfce7" : "transparent"}
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5,5"
              className={`cursor-pointer transition-all duration-300 ${
                dragOverZone === "crew1"
                  ? "fill-green-100 stroke-green-500 drop-shadow-lg"
                  : "hover:fill-green-50 hover:drop-shadow-md"
              }`}
              onDragOver={(e) => handleZoneDragOver(e, "crew1")}
              onDragLeave={handleZoneDragLeave}
              onDrop={(e) => onPersonnelDrop?.(e, "crew1")}
              rx="5"
            />
            <text x="110" y="275" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="bold">
              Crew 1
            </text>

            {/* Crew section 2 */}
            <rect
              x="150"
              y="155"
              width="40"
              height="90"
              fill="transparent"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5,5"
              className={`cursor-pointer transition-all duration-300 ${
                dragOverZone === "crew2"
                  ? "fill-green-100 stroke-green-500 drop-shadow-lg"
                  : "hover:fill-green-50 hover:drop-shadow-md"
              }`}
              onDragOver={(e) => handleZoneDragOver(e, "crew2")}
              onDragLeave={handleZoneDragLeave}
              onDrop={(e) => onPersonnelDrop?.(e, "crew2")}
              rx="5"
            />
            <text x="170" y="275" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="bold">
              Crew 2
            </text>

            {/* Crew section 3 */}
            <rect
              x="210"
              y="155"
              width="40"
              height="90"
              fill="transparent"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5,5"
              className={`cursor-pointer transition-all duration-300 ${
                dragOverZone === "crew3"
                  ? "fill-green-100 stroke-green-500 drop-shadow-lg"
                  : "hover:fill-green-50 hover:drop-shadow-md"
              }`}
              onDragOver={(e) => handleZoneDragOver(e, "crew3")}
              onDragLeave={handleZoneDragLeave}
              onDrop={(e) => onPersonnelDrop?.(e, "crew3")}
              rx="5"
            />
            <text x="230" y="275" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="bold">
              Crew 3
            </text>

            {/* Crew section 4 */}
            <rect
              x="270"
              y="155"
              width="40"
              height="90"
              fill="transparent"
              stroke="#22c55e"
              strokeWidth="2"
              strokeDasharray="5,5"
              className={`cursor-pointer transition-all duration-300 ${
                dragOverZone === "crew4"
                  ? "fill-green-100 stroke-green-500 drop-shadow-lg"
                  : "hover:fill-green-50 hover:drop-shadow-md"
              }`}
              onDragOver={(e) => handleZoneDragOver(e, "crew4")}
              onDragLeave={handleZoneDragLeave}
              onDrop={(e) => onPersonnelDrop?.(e, "crew4")}
              rx="5"
            />
            <text x="290" y="275" textAnchor="middle" fontSize="10" fill="#22c55e" fontWeight="bold">
              Crew 4
            </text>

            {/* Enhanced crew member display */}
            {selectedVehicle?.assignedCrew && (
              <g className="transition-all duration-300">
                <circle cx="110" cy="200" r="12" fill="#22c55e" className="drop-shadow-sm" />
                <text x="110" y="205" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                  {selectedVehicle.assignedCrew.name.charAt(0)}
                </text>
                <text x="110" y="220" textAnchor="middle" fontSize="8" fill="#166534" fontWeight="bold">
                  {selectedVehicle.assignedCrew.name}
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>
    )
  }

  const handleSectionDrop = (e: React.DragEvent, section: string) => {
    e.preventDefault()
    if (!draggedItem || !selectedVehicle) return

    if (!draggedFromVehicle) {
      const capacity = selectedVehicle.capacity_kg || 40000
      const availableCapacity = capacity - selectedVehicle.total_assigned_kg

      if (availableCapacity < draggedItem.weight) {
        alert(`Not enough capacity! Available: ${availableCapacity.toFixed(1)}kg, Required: ${draggedItem.weight}kg`)
        return
      }
    }

    console.log(`[v0] Item ${draggedItem.description} dropped in ${section}`)

    // Handle the drop logic similar to existing handleDrop but with section info
    if (!draggedFromVehicle) {
      const newOrder: Order = {
        order_id: `new-order-${Date.now()}`,
        sales_order_number: `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        customer_name: "MANUAL ASSIGNMENT",
        order_status: `Manually Assigned - ${section}`,
        total_weight: draggedItem.weight,
        items: [{ ...draggedItem, id: `${draggedItem.id}-${section}` }],
      }

      const updatedVehicles = vehicles.map((vehicle) => {
        if (vehicle.vehicle_id === selectedVehicle.vehicle_id) {
          const updatedLoads = [...vehicle.loads]
          if (updatedLoads.length > 0) {
            updatedLoads[0] = {
              ...updatedLoads[0],
              orders: [...updatedLoads[0].orders, newOrder],
              required_kg: updatedLoads[0].required_kg + draggedItem.weight,
            }
          }

          return {
            ...vehicle,
            loads: updatedLoads,
            total_assigned_kg: vehicle.total_assigned_kg + draggedItem.weight,
          }
        }
        return vehicle
      })

      setVehicles(updatedVehicles)
      const updatedSelected = updatedVehicles.find((v) => v.vehicle_id === selectedVehicle.vehicle_id)
      setSelectedVehicle(updatedSelected || null)
    }

    setDraggedItem(null)
    setDraggedFromVehicle(false)
  }

  const handleRemoveItemFromVehicle = (itemToRemove: Item, orderId: string, loadId: string) => {
    if (!selectedVehicle) return

    const updatedVehicles = vehicles.map((vehicle) => {
      if (vehicle.vehicle_id === selectedVehicle.vehicle_id) {
        const updatedLoads = vehicle.loads.map((load) => {
          if (load.load_id === loadId) {
            const updatedOrders = load.orders
              .map((order) => {
                if (order.order_id === orderId) {
                  const updatedItems = order.items.filter((item) => item.id !== itemToRemove.id)
                  return {
                    ...order,
                    items: updatedItems,
                    total_weight: order.total_weight - itemToRemove.weight,
                  }
                }
                return order
              })
              .filter((order) => order.items.length > 0)

            return {
              ...load,
              orders: updatedOrders,
              required_kg: load.required_kg - itemToRemove.weight,
            }
          }
          return load
        })

        return {
          ...vehicle,
          loads: updatedLoads,
          total_assigned_kg: vehicle.total_assigned_kg - itemToRemove.weight,
        }
      }
      return vehicle
    })

    setVehicles(updatedVehicles)
    const updatedSelected = updatedVehicles.find((v) => v.vehicle_id === selectedVehicle.vehicle_id)
    setSelectedVehicle(updatedSelected || null)
  }

  const handlePersonnelDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault()
    if (!selectedVehicle) return

    if (draggedDriver) {
      assignDriverToVehicle(draggedDriver, selectedVehicle)
    } else if (draggedCrew) {
      assignCrewToVehicle(draggedCrew, selectedVehicle)
    }

    setDraggedDriver(null)
    setDraggedCrew(null)
  }

  if (currentView === "loading" && selectedVehicle) {
    const utilization = getVehicleUtilization(selectedVehicle)
    const capacity = selectedVehicle.capacity_kg || 40000
    const availableCapacity = capacity - selectedVehicle.total_assigned_kg

    return (
      <div className="bg-gray-50 p-6 min-h-screen">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("assignment")} className="mb-4">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Assignment
          </Button>
          <div className="bg-white p-4 border rounded-lg">
            <h1 className="font-semibold text-xl">
              {selectedVehicle.vehicleInfo?.structureName} - {selectedRoute?.route_name}
            </h1>
            <p className="text-gray-600 text-sm">
              {selectedVehicle.vehicleInfo?.registrationNo} | Fleet: {selectedVehicle.vehicleInfo?.fleetNo}
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Capacity: {capacity.toLocaleString()}kg</span>
              <span>Available: {availableCapacity.toLocaleString()}kg</span>
              <span>Utilization: {utilization}%</span>
            </div>
          </div>
        </div>

        <TruckVisualization selectedVehicle={selectedVehicle} onPersonnelDrop={handlePersonnelDrop} />
      </div>
    )
  }

  if (currentView === "vehicles" && selectedRoute) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("routes")} className="mb-4">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Routes
          </Button>
          <div className="bg-white p-4 border rounded-lg">
            <h1 className="font-semibold text-xl">Vehicles for {selectedRoute.route_name}</h1>
            <p className="text-gray-600 text-sm">Select a vehicle to assign driver and crew</p>
          </div>
        </div>

        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {selectedRoute.vehicles.map((vehicle) => {
            const utilization = getVehicleUtilization(vehicle)
            return (
              <Card
                key={vehicle.vehicle_id}
                className="hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedVehicle(vehicle)
                  setCurrentView("assignment")
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{vehicle.vehicleInfo?.structureName}</h3>
                    <Badge variant={utilization > 80 ? "destructive" : utilization > 50 ? "default" : "secondary"}>
                      {utilization}%
                    </Badge>
                  </div>
                  <div className="text-gray-600 text-sm">
                    <p>Reg: {vehicle.vehicleInfo?.registrationNo}</p>
                    <p>Fleet: {vehicle.vehicleInfo?.fleetNo}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span>{(vehicle.capacity_kg || 40000).toLocaleString()}kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Assigned:</span>
                      <span>{vehicle.total_assigned_kg.toLocaleString()}kg</span>
                    </div>
                    <div className="bg-gray-200 rounded-full w-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          utilization > 80 ? "bg-red-500" : utilization > 50 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (currentView === "assignment" && selectedVehicle) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("vehicles")} className="mb-4">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Vehicles
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
          {/* Left Section - Truck Visualization and Assignment Status */}
          <div className="space-y-6">
            <TruckVisualization selectedVehicle={selectedVehicle} onPersonnelDrop={handlePersonnelDrop} />

            <Card className="w-full">
              <CardHeader>
                <h3 className="font-semibold text-lg">Assignment Status</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${selectedVehicle.assignedDriver ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className="text-sm">
                    Driver:{" "}
                    {selectedVehicle.assignedDriver ? selectedVehicle.assignedDriver.name.toUpperCase() : "Not assigned"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${selectedVehicle.assignedCrew ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className="text-sm">
                    Crew:{" "}
                    {selectedVehicle.assignedCrew ? selectedVehicle.assignedCrew.name.toUpperCase() : "Not assigned"}
                  </span>
                </div>
                <Button
                  className="bg-black hover:bg-gray-800 w-full text-white"
                  onClick={() => setCurrentView("loading")}
                  disabled={!selectedVehicle.assignedDriver || !selectedVehicle.assignedCrew}
                >
                  Proceed to Loading
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Personnel Assignment Cards */}
          <div className="space-y-6">
            <Card>
          <CardHeader className="pb-3">
            <h4 className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-blue-600" />
              Available Drivers
            </h4>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Enhanced driver cards with smoother animations */}
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  draggable={driver.available}
                  onDragStart={(e) => handlePersonnelDragStart(e, driver, "driver")}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-lg border cursor-move transition-all duration-300 transform ${
                    selectedVehicle?.assignedDriver?.id === driver.id
                      ? "bg-blue-50 border-blue-300 shadow-md scale-102"
                      : driver.available
                        ? isDragging && draggedDriver?.id === driver.id
                          ? "opacity-60 scale-95 rotate-2 shadow-lg"
                          : "hover:bg-gray-50 border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-1"
                        : "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div className="flex items-center gap-3 font-medium">
                    <GripVertical
                      className={`w-4 h-4 transition-colors duration-200 ${
                        driver.available ? "text-gray-400 group-hover:text-blue-500" : "text-gray-300"
                      }`}
                    />
                    {driver.name} {driver.initial} {driver.surname}
                  </div>
                  <div className="mt-1 text-gray-600 text-xs">
                    {selectedVehicle?.assignedDriver?.id === driver.id
                      ? "✓ Assigned to this vehicle"
                      : driver.available
                        ? "Available for assignment"
                        : "Currently assigned"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h4 className="flex items-center gap-2 font-medium">
              <Users className="w-4 h-4 text-green-600" />
              Available Crew
            </h4>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {/* Enhanced crew cards with smoother animations */}
              {crew.map((crewman) => (
                <div
                  key={crewman.id}
                  draggable={crewman.available}
                  onDragStart={(e) => handlePersonnelDragStart(e, crewman, "crew")}
                  onDragEnd={handleDragEnd}
                  className={`p-4 rounded-lg border cursor-move transition-all duration-300 transform ${
                    selectedVehicle?.assignedCrew?.id === crewman.id
                      ? "bg-green-50 border-green-300 shadow-md scale-102"
                      : crewman.available
                        ? isDragging && draggedCrew?.id === crewman.id
                          ? "opacity-60 scale-95 rotate-2 shadow-lg"
                          : "hover:bg-gray-50 border-gray-200 hover:shadow-lg hover:scale-105 hover:-translate-y-1"
                        : "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div className="flex items-center gap-3 font-medium">
                    <GripVertical
                      className={`w-4 h-4 transition-colors duration-200 ${
                        crewman.available ? "text-gray-400 group-hover:text-green-500" : "text-gray-300"
                      }`}
                    />
                    {crewman.name} {crewman.initial} {crewman.surname}
                  </div>
                  <div className="mt-1 text-gray-600 text-xs">
                    {selectedVehicle?.assignedCrew?.id === crewman.id
                      ? "✓ Assigned to this vehicle"
                      : crewman.available
                        ? "Available for assignment"
                        : "Currently assigned"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="mb-6">
        <div className="bg-white p-4 border rounded-lg">
          <h1 className="mb-2 font-bold text-2xl">Allied Steelrode Logistics</h1>
          <p className="text-gray-600">Select a route to manage vehicles and assignments</p>
          <div className="relative mt-4">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
            <input
              type="text"
              placeholder="Search by route name"
              className="py-2 pr-4 pl-10 border border-gray-200 rounded-lg w-full max-w-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <Card
            key={route.route_id}
            className="hover:shadow-lg hover:border-blue-300 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedRoute(route)
              setCurrentView("vehicles")
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{route.route_name}</h3>
                <Badge variant="outline">{route.vehicles.length} vehicles</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Vehicles:</span>
                  <span>{route.vehicles.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Capacity:</span>
                  <span>
                    {route.vehicles.reduce((sum, vehicle) => sum + (vehicle.capacity_kg || 40000), 0).toLocaleString()}
                    kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Assigned Load:</span>
                  <span>
                    {route.vehicles.reduce((sum, vehicle) => sum + vehicle.total_assigned_kg, 0).toLocaleString()}kg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Enhanced drag feedback with smooth animations */}
      {isDragging && dragPosition && (
        <div
          className="z-50 fixed transition-all duration-200 pointer-events-none"
          style={{
            left: dragPosition.x + 15,
            top: dragPosition.y - 35,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl px-3 py-2 border border-blue-400 rounded-lg font-medium text-white text-xs">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full w-2 h-2 animate-pulse"></div>
              {draggedItem
                ? `${draggedItem.description.substring(0, 25)}... (${draggedItem.weight}kg)`
                : draggedDriver
                  ? `Driver: ${draggedDriver.name} ${draggedDriver.surname}`
                  : draggedCrew
                    ? `Crew: ${draggedCrew.name} ${draggedCrew.surname}`
                    : "Dragging..."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
