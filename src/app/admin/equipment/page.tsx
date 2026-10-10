"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Wrench, Settings, Activity, AlertTriangle, Calendar, Plus, Edit } from 'lucide-react'
import { format } from 'date-fns'

interface Equipment {
  _id: string
  name: string
  model: string
  manufacturer: string
  serialNumber: string
  status: 'operational' | 'maintenance' | 'out_of_order' | 'retired'
  location: string
  purchaseDate: string
  warrantyExpiry?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  calibrationDue?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface MaintenanceRecord {
  date: string
  type: 'routine' | 'repair' | 'calibration'
  description: string
  performedBy: string
  nextDue?: string
}

const statusColors = {
  operational: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  out_of_order: 'bg-red-100 text-red-800',
  retired: 'bg-gray-100 text-gray-800',
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog states
  const [addDialog, setAddDialog] = useState(false)
  const [maintenanceDialog, setMaintenanceDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    manufacturer: '',
    serialNumber: '',
    location: '',
    purchaseDate: '',
    warrantyExpiry: '',
    notes: ''
  })
  
  const [maintenanceData, setMaintenanceData] = useState({
    type: 'routine',
    description: '',
    nextDue: ''
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/equipment')
      if (res.ok) {
        const data = await res.json()
        setEquipment(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEquipment = async () => {
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await fetchEquipment()
        setAddDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to add equipment:', error)
    }
  }

  const handleRecordMaintenance = async () => {
    if (!selectedEquipment) return

    try {
      const res = await fetch(`/api/equipment/${selectedEquipment._id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...maintenanceData,
          date: new Date().toISOString()
        })
      })

      if (res.ok) {
        await fetchEquipment()
        setMaintenanceDialog(false)
        setSelectedEquipment(null)
        setMaintenanceData({
          type: 'routine',
          description: '',
          nextDue: ''
        })
      }
    } catch (error) {
      console.error('Failed to record maintenance:', error)
    }
  }

  const handleUpdateStatus = async (equipmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        await fetchEquipment()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      model: '',
      manufacturer: '',
      serialNumber: '',
      location: '',
      purchaseDate: '',
      warrantyExpiry: '',
      notes: ''
    })
  }

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalEquipment = equipment.length
  const operational = equipment.filter(e => e.status === 'operational').length
  const maintenance = equipment.filter(e => e.status === 'maintenance').length
  const alerts = equipment.filter(e => 
    e.status === 'out_of_order' || 
    (e.calibrationDue && new Date(e.calibrationDue) < new Date()) ||
    (e.warrantyExpiry && new Date(e.warrantyExpiry) < new Date())
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
          <p className="text-gray-600">Monitor and maintain laboratory equipment</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
            <p className="text-xs text-muted-foreground">Registered devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operational}</div>
            <p className="text-xs text-muted-foreground">Working normally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenance}</div>
            <p className="text-xs text-muted-foreground">Being serviced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, model, or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_order">Out of Order</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
          <CardDescription>Manage laboratory equipment and maintenance schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEquipment.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No equipment found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.model} - {item.manufacturer}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.serialNumber}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status]}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.nextMaintenanceDate ? (
                        <span className="text-sm">
                          {format(new Date(item.nextMaintenanceDate), 'PP')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEquipment(item)
                            setMaintenanceDialog(true)
                          }}
                        >
                          <Wrench className="h-3 w-3 mr-1" />
                          Maintenance
                        </Button>
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleUpdateStatus(item._id, value)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="out_of_order">Out of Order</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>Register new laboratory equipment</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Lab Room 101"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Installation notes, special requirements, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddEquipment}
              disabled={!formData.name || !formData.model || !formData.manufacturer || !formData.serialNumber}
            >
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialog} onOpenChange={setMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Maintenance</DialogTitle>
            <DialogDescription>
              {selectedEquipment?.name} - {selectedEquipment?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="maintenanceType">Maintenance Type</Label>
              <Select 
                value={maintenanceData.type} 
                onValueChange={(value: any) => setMaintenanceData({ ...maintenanceData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="calibration">Calibration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What was done..."
                value={maintenanceData.description}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="nextDue">Next Maintenance Due</Label>
              <Input
                id="nextDue"
                type="date"
                value={maintenanceData.nextDue}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, nextDue: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordMaintenance}
              disabled={!maintenanceData.description}
            >
              Record Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
