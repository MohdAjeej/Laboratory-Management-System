import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import Report from '@/models/Report'
import Order from '@/models/Order'
import Patient from '@/models/Patient'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { reportId, patientDOB } = await request.json()

    // Validate input
    if (!reportId || !patientDOB) {
      return NextResponse.json(
        { error: 'Report ID and patient date of birth are required' },
        { status: 400 }
      )
    }

    // Find report by reportId (not _id)
    const report = await Report.findOne({ reportId })
      .populate({
        path: 'order',
        populate: [
          { path: 'patient', select: 'name patientId dateOfBirth age gender phone' },
          { path: 'hospital', select: 'name address' },
          {
            path: 'tests.test',
            select: 'name code'
          }
        ]
      })
      .populate('verifiedBy', 'name qualification')
      .lean()

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Verify patient DOB matches
    const order: any = report.order
    const patient: any = order?.patient

    if (!patient || !patient.dateOfBirth) {
      return NextResponse.json(
        { error: 'Invalid report data' },
        { status: 400 }
      )
    }

    // Compare dates (format: YYYY-MM-DD)
    const reportDOB = new Date(patient.dateOfBirth).toISOString().split('T')[0]
    const providedDOB = new Date(patientDOB).toISOString().split('T')[0]

    if (reportDOB !== providedDOB) {
      return NextResponse.json(
        { error: 'Date of birth does not match our records' },
        { status: 403 }
      )
    }

    // Check if report is verified
    if (report.status !== 'verified') {
      return NextResponse.json(
        { 
          error: 'Report is not yet verified',
          status: report.status 
        },
        { status: 403 }
      )
    }

    // Return safe report data (exclude sensitive internal IDs)
    const safeReport = {
      reportId: report.reportId,
      reportDate: report.reportDate,
      status: report.status,
      patient: {
        name: patient.name,
        patientId: patient.patientId,
        age: patient.age,
        gender: patient.gender
      },
      hospital: order.hospital ? {
        name: order.hospital.name,
        address: order.hospital.address
      } : null,
      tests: order.tests.map((t: any) => ({
        name: t.test?.name,
        code: t.test?.code
      })),
      results: report.results,
      observations: report.observations,
      verifiedBy: report.verifiedBy ? {
        name: report.verifiedBy.name,
        qualification: report.verifiedBy.qualification
      } : null,
      verifiedAt: report.verifiedAt,
      pdfUrl: report.pdfUrl
    }

    return NextResponse.json({
      success: true,
      data: safeReport
    })
  } catch (error) {
    console.error('Report verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify report' },
      { status: 500 }
    )
  }
}
