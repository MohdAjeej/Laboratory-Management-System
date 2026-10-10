"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { CheckCircle, XCircle, AlertCircle, ClipboardCheck, Plus, FlaskConical } from 'lucide-react'
import { format } from 'date-fns'

interface QCLot {
  _id: string
  lotNumber: string
  testName: string
  level: string
  manufacturer: string
  expiryDate: string
  receivedDate: string
  status: 'active' | 'expired' | 'depleted'
  expectedRange: {
    min: number
    max: number
    unit: string
  }
  notes?: string
}

interface QCRun {
  _id: string
  lot: {
    _id: string
    lotNumber: string
    testName: string
  }
  runDate: string
  observedValue: number
  result: 'pass' | 'fail'
  performedBy: {
    _id: string
    name: string
  }
  instrument?: string
  comments?: string
}

export default function QualityControlPage() {
  const [lots, setLots] = useState<QCLot[]>([])
  const [runs, setRuns] = useState<QCRun[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [addLotDialog, setAddLotDialog] = useState(false)
  const [addRunDialog, setAddRunDialog] = useState(false)
  
  // Form states
  const [lotForm, setLotForm] = useState({
    lotNumber: '',
    testName: '',
    level: 'Normal',
    manufacturer: '',
    expiryDate: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expectedMin: '',
    expectedMax: '',
    unit: '',
    notes: ''
  })
  
  const [runForm, setRunForm] = useState({
    lotId: '',
    observedValue: '',
    instrument: '',
    comments: ''
  })

  useEffect(() => {
    fetchLots()
    fetchRuns()
  }, [])

  const fetchLots = async () => {
    try {
      const res = await fetch('/api/qc/lots')
      if (res.ok) {
        const data = await res.json()
        setLots(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch QC lots:', error)
    }
  }

  const fetchRuns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/qc/runs')
      if (res.ok) {
        const data = await res.json()
        setRuns(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch QC runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLot = async () => {
    try {
      const res = await fetch('/api/qc/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lotForm,
          expectedRange: {
            min: parseFloat(lotForm.expectedMin),
            max: parseFloat(lotForm.expectedMax),
            unit: lotForm.unit
          }
        })
      })

      if (res.ok) {
        await fetchLots()
        setAddLotDialog(false)
        resetLotForm()
      }
    } catch (error) {
      console.error('Failed to add QC lot:', error)
    }
  }

  const handleAddRun = async () => {
    try {
      const res = await fetch('/api/qc/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotId: runForm.lotId,
          observedValue: parseFloat(runForm.observedValue),
          instrument: runForm.instrument,
          comments: runForm.comments
        })
      })

      if (res.ok) {
        await fetchRuns()
        setAddRunDialog(false)
        resetRunForm()
      }
    } catch (error) {
      console.error('Failed to record QC run:', error)
    }
  }

  const resetLotForm = () => {
    setLotForm({
      lotNumber: '',
      testName: '',
      level: 'Normal',
      manufacturer: '',
      expiryDate: '',
      receivedDate: new Date().toISOString().split('T')[0],
      expectedMin: '',
      expectedMax: '',
      unit: '',
      notes: ''
    })
  }

  const resetRunForm = () => {
    setRunForm({
      lotId: '',
      observedValue: '',
      instrument: '',
      comments: ''
    })
  }

  const getLotStatusBadge = (lot: QCLot) => {
    if (lot.status === 'expired') {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>
    }
    if (lot.status === 'depleted') {
      return <Badge className="bg-gray-100 text-gray-800">Depleted</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const activeLots = lots.filter(l => l.status === 'active')
  const totalRuns = runs.length
  const passedRuns = runs.filter(r => r.result === 'pass').length
  const failedRuns = runs.filter(r => r.result === 'fail').length
  const passRate = totalRuns > 0 ? ((passedRuns / totalRuns) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quality control data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-gray-600">Monitor test quality and maintain control lots</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lots</CardTitle>
            <FlaskConical className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLots.length}</div>
            <p className="text-xs text-muted-foreground">QC materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground">QC tests performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
            <p className="text-xs text-muted-foreground">{passedRuns} passed, {failedRuns} failed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedRuns}</div>
            <p className="text-xs text-muted-foreground">Failed QC runs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">QC Runs</TabsTrigger>
          <TabsTrigger value="lots">Control Lots</TabsTrigger>
        </TabsList>

        {/* QC Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>QC Test Runs</CardTitle>
                  <CardDescription>Record and monitor quality control results</CardDescription>
                </div>
                <Button onClick={() => setAddRunDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record QC Run
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {runs.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p>No QC runs recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Lot Number</TableHead>
                      <TableHead>Observed Value</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Instrument</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run._id}>
                        <TableCell>{format(new Date(run.runDate), 'PPp')}</TableCell>
                        <TableCell className="font-medium">{run.lot.testName}</TableCell>
                        <TableCell className="font-mono text-sm">{run.lot.lotNumber}</TableCell>
                        <TableCell className="font-semibold">{run.observedValue}</TableCell>
                        <TableCell>
                          {run.result === 'pass' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              PASS
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              FAIL
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{run.performedBy.name}</TableCell>
                        <TableCell>{run.instrument || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Control Lots Tab */}
        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Control Lots</CardTitle>
                  <CardDescription>Manage QC materials inventory</CardDescription>
                </div>
                <Button onClick={() => setAddLotDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Control Lot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lots.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p>No control lots registered</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lot Number</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Expected Range</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.map((lot) => (
                      <TableRow key={lot._id}>
                        <TableCell className="font-mono font-semibold">{lot.lotNumber}</TableCell>
                        <TableCell>{lot.testName}</TableCell>
                        <TableCell>{lot.level}</TableCell>
                        <TableCell>
                          {lot.expectedRange.min} - {lot.expectedRange.max} {lot.expectedRange.unit}
                        </TableCell>
                        <TableCell>{lot.manufacturer}</TableCell>
                        <TableCell>{format(new Date(lot.expiryDate), 'PP')}</TableCell>
                        <TableCell>{getLotStatusBadge(lot)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Lot Dialog */}
      <Dialog open={addLotDialog} onOpenChange={setAddLotDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Control Lot</DialogTitle>
            <DialogDescription>Register new QC material</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lotNumber">Lot Number *</Label>
              <Input
                id="lotNumber"
                value={lotForm.lotNumber}
                onChange={(e) => setLotForm({ ...lotForm, lotNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                value={lotForm.testName}
                onChange={(e) => setLotForm({ ...lotForm, testName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={lotForm.level} onValueChange={(value) => setLotForm({ ...lotForm, level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={lotForm.manufacturer}
                onChange={(e) => setLotForm({ ...lotForm, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expectedMin">Expected Min *</Label>
              <Input
                id="expectedMin"
                type="number"
                step="0.01"
                value={lotForm.expectedMin}
                onChange={(e) => setLotForm({ ...lotForm, expectedMin: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expectedMax">Expected Max *</Label>
              <Input
                id="expectedMax"
                type="number"
                step="0.01"
                value={lotForm.expectedMax}
                onChange={(e) => setLotForm({ ...lotForm, expectedMax: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                placeholder="e.g., mg/dL"
                value={lotForm.unit}
                onChange={(e) => setLotForm({ ...lotForm, unit: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="receivedDate">Received Date *</Label>
              <Input
                id="receivedDate"
                type="date"
                value={lotForm.receivedDate}
                onChange={(e) => setLotForm({ ...lotForm, receivedDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={lotForm.expiryDate}
                onChange={(e) => setLotForm({ ...lotForm, expiryDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={lotForm.notes}
                onChange={(e) => setLotForm({ ...lotForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLotDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddLot}
              disabled={!lotForm.lotNumber || !lotForm.testName || !lotForm.manufacturer || !lotForm.expiryDate}
            >
              Add Lot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Run Dialog */}
      <Dialog open={addRunDialog} onOpenChange={setAddRunDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record QC Run</DialogTitle>
            <DialogDescription>Enter quality control test results</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lotId">Control Lot *</Label>
              <Select value={runForm.lotId} onValueChange={(value) => setRunForm({ ...runForm, lotId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select control lot..." />
                </SelectTrigger>
                <SelectContent>
                  {activeLots.map((lot) => (
                    <SelectItem key={lot._id} value={lot._id}>
                      {lot.lotNumber} - {lot.testName} ({lot.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="observedValue">Observed Value *</Label>
              <Input
                id="observedValue"
                type="number"
                step="0.01"
                value={runForm.observedValue}
                onChange={(e) => setRunForm({ ...runForm, observedValue: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="instrument">Instrument</Label>
              <Input
                id="instrument"
                value={runForm.instrument}
                onChange={(e) => setRunForm({ ...runForm, instrument: e.target.value })}
                placeholder="e.g., Analyzer-001"
              />
            </div>
            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={runForm.comments}
                onChange={(e) => setRunForm({ ...runForm, comments: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRunDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddRun}
              disabled={!runForm.lotId || !runForm.observedValue}
            >
              Record Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

