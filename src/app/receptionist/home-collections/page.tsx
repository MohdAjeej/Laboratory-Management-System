"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, User, Phone, Clock, CheckCircle, XCircle, Truck, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface HomeCollection {
  _id: string
  patient: {
    _id: string
    name: string
    phone: string
    email: string
  }
  order: {
    _id: string
    orderId: string
  }
  address: {
    street: string
    city: string
    state: string
    pincode: string
    landmark?: string
  }
  preferredDate: string
  preferredTime: string
  status: 'requested' | 'scheduled' | 'assigned' | 'in_transit' | 'collected' | 'failed' | 'cancelled'
  scheduledDate?: string
  scheduledTime?: string
  assignedTo?: {
    _id: string
    name: string
    phone: string
  }
  notes?: string
  createdAt: string
}

interface User {
  _id: string
  name: string
  phone: string
  email: string
}

const statusColors = {
  requested: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  assigned: "bg-purple-100 text-purple-800",
  in_transit: "bg-indigo-100 text-indigo-800",
  collected: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function HomeCollectionsPage() {
  const [collections, setCollections] = useState<HomeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  // Dialog states
  const [scheduleDialog, setScheduleDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<HomeCollection | null>(null)
  
  // Form states
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [scheduleNotes, setScheduleNotes] = useState("")
  
  const [technicians, setTechnicians] = useState<User[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState("")
  const [assignNotes, setAssignNotes] = useState("")

  useEffect(() => {
    fetchCollections()
    fetchTechnicians()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/home-collections')
      if (res.ok) {
        const data = await res.json()
        setCollections(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch home collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/users?role=TECHNICIAN')
      if (res.ok) {
        const data = await res.json()
        setTechnicians(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch technicians:', error)
    }
  }

  const handleSchedule = async () => {
    if (!selectedCollection || !scheduledDate || !scheduledTime) return

    try {
      const res = await fetch(`/api/home-collections/${selectedCollection._id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate,
          scheduledTime,
          notes: scheduleNotes
        })
      })

      if (res.ok) {
        await fetchCollections()
        setScheduleDialog(false)
        setSelectedCollection(null)
        setScheduledDate("")
        setScheduledTime("")
        setScheduleNotes("")
      }
    } catch (error) {
      console.error('Failed to schedule collection:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedCollection || !selectedTechnician) return

    try {
      const res = await fetch(`/api/home-collections/${selectedCollection._id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTechnician,
          notes: assignNotes
        })
      })

      if (res.ok) {
        await fetchCollections()
        setAssignDialog(false)
        setSelectedCollection(null)
        setSelectedTechnician("")
        setAssignNotes("")
      }
    } catch (error) {
      console.error('Failed to assign technician:', error)
    }
  }

  const handleCancel = async (collectionId: string) => {
    if (!confirm('Are you sure you want to cancel this collection?')) return

    try {
      const res = await fetch(`/api/home-collections/${collectionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchCollections()
      }
    } catch (error) {
      console.error('Failed to cancel collection:', error)
    }
  }

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = 
      collection.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.patient.phone.includes(searchTerm) ||
      collection.order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || collection.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Home Collections</h1>
          <p className="text-gray-600 mt-1">Manage sample collection requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by patient name, phone, or order ID..."
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
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections Grid */}
      <div className="grid gap-4">
        {filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No collections found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCollections.map((collection) => (
            <Card key={collection._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{collection.patient.name}</CardTitle>
                    <CardDescription>Order: {collection.order.orderId}</CardDescription>
                  </div>
                  <Badge className={statusColors[collection.status]}>
                    {collection.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{collection.patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{collection.patient.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span>
                        {collection.address.street}, {collection.address.city}, {collection.address.state} - {collection.address.pincode}
                        {collection.address.landmark && ` (Near: ${collection.address.landmark})`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Preferred: {format(new Date(collection.preferredDate), 'PPP')} at {collection.preferredTime}</span>
                    </div>
                    {collection.scheduledDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Scheduled: {format(new Date(collection.scheduledDate), 'PPP')} at {collection.scheduledTime}</span>
                      </div>
                    )}
                    {collection.assignedTo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span>Assigned to: {collection.assignedTo.name} ({collection.assignedTo.phone})</span>
                      </div>
                    )}
                  </div>
                </div>

                {collection.notes && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">{collection.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {collection.status === 'requested' && (
                    <Button 
                      onClick={() => {
                        setSelectedCollection(collection)
                        setScheduleDialog(true)
                      }}
                      size="sm"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  )}
                  {collection.status === 'scheduled' && (
                    <Button 
                      onClick={() => {
                        setSelectedCollection(collection)
                        setAssignDialog(true)
                      }}
                      size="sm"
                    >
                      <User className="h-4 w-4 mr-1" />
                      Assign Technician
                    </Button>
                  )}
                  {['requested', 'scheduled'].includes(collection.status) && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(collection._id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Collection</DialogTitle>
            <DialogDescription>
              Set the date and time for sample collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduled-date">Scheduled Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="scheduled-time">Scheduled Time</Label>
              <Input
                id="scheduled-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="schedule-notes">Notes (Optional)</Label>
              <Textarea
                id="schedule-notes"
                placeholder="Any special instructions..."
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={!scheduledDate || !scheduledTime}>
              Schedule Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              Select a technician for this collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="technician">Technician</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger id="technician">
                  <SelectValue placeholder="Select technician..." />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech._id} value={tech._id}>
                      {tech.name} - {tech.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-notes">Notes (Optional)</Label>
              <Textarea
                id="assign-notes"
                placeholder="Special instructions for technician..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedTechnician}>
              Assign Technician
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
