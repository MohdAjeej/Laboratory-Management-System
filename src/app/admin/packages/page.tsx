"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Package, Plus, TrendingUp, DollarSign, Search, Edit, Trash2 } from 'lucide-react'

interface Test {
  _id: string
  name: string
  code: string
  price: number
}

interface PackageTest {
  test: string
  testName?: string
}

interface TestPackage {
  _id: string
  packageId: string
  name: string
  description?: string
  category: string
  tests: Array<{
    testId: string
    isOptional: boolean
  }>
  price: number
  discountPercentage?: number
  isActive: boolean
  createdAt: string
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<TestPackage[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [addDialog, setAddDialog] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<TestPackage | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    tests: [] as string[],
    price: 0,
    discount: 0
  })

  useEffect(() => {
    fetchPackages()
    fetchTests()
  }, [])

  const fetchPackages = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/packages')
      if (res.ok) {
        const data = await res.json()
        setPackages(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests')
      if (res.ok) {
        const data = await res.json()
        setTests(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error)
      setTests([])
    }
  }

  const handleAddPackage = async () => {
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await fetchPackages()
        setAddDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to add package:', error)
    }
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchPackages()
      }
    } catch (error) {
      console.error('Failed to delete package:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      tests: [],
      price: 0,
      discount: 0
    })
    setSelectedPackage(null)
  }

  const handleTestSelection = (testId: string) => {
    const currentTests = formData.tests
    if (currentTests.includes(testId)) {
      setFormData({
        ...formData,
        tests: currentTests.filter(id => id !== testId)
      })
    } else {
      setFormData({
        ...formData,
        tests: [...currentTests, testId]
      })
    }
  }

  const filteredPackages = Array.isArray(packages) ? packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.packageId.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const totalPackages = Array.isArray(packages) ? packages.length : 0
  const activePackages = Array.isArray(packages) ? packages.filter(p => p.isActive).length : 0
  const totalRevenue = 0 // This would come from orders data

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Packages</h1>
          <p className="text-gray-600">Manage test packages and bundles</p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPackages}</div>
            <p className="text-xs text-muted-foreground">Available packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePackages}</div>
            <p className="text-xs text-muted-foreground">Currently offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Package</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Most ordered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From packages</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Packages</CardTitle>
          <CardDescription>Test packages and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPackages.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm">No test packages available</p>
              <Button className="mt-4" variant="outline" onClick={() => setAddDialog(true)}>
                Create First Package
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Package ID</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg._id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell className="font-mono">{pkg.packageId}</TableCell>
                    <TableCell>{pkg.tests.length} tests</TableCell>
                    <TableCell>₹{pkg.price.toLocaleString()}</TableCell>
                    <TableCell>{pkg.discountPercentage || 0}%</TableCell>
                    <TableCell>
                      <Badge className={pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePackage(pkg._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Package Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Package</DialogTitle>
            <DialogDescription>Bundle multiple tests into a package</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Complete Health Checkup"
                />
              </div>
              <div>
                <Label htmlFor="code">Package Code (Optional)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., HEALTH-PKG (auto-generated if empty)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the package"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Package Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label>Select Tests * (Click to add/remove)</Label>
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                {tests.length === 0 ? (
                  <p className="text-sm text-gray-500">No tests available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {tests.map((test) => (
                      <div
                        key={test._id}
                        onClick={() => handleTestSelection(test._id)}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          formData.tests.includes(test._id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-gray-500">{test.code} - ₹{test.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.tests.length} test(s)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddPackage}
              disabled={!formData.name || formData.tests.length === 0}
            >
              Create Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
