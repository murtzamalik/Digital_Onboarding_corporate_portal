import { apiClient } from './client'
import { type SpringPage } from './types'

export type PortalBatchEmployeeRow = {
  employeeRef: string
  status: string
  fullName: string
  mobileMasked: string
  cnicMasked: string
  email: string | null
  inviteSentAt: string | null
  expireAt: string | null
  createdAt: string
  updatedAt: string
}

export type PortalEmployeeDetail = {
  employeeRef: string
  batchReference: string
  status: string
  fullName: string
  fatherName: string | null
  motherName: string | null
  dateOfBirth: string | null
  gender: string | null
  religion: string | null
  mobileMasked: string
  cnicMasked: string
  email: string | null
  cnicIssueDate: string | null
  cnicExpiryDate: string | null
  presentAddressLine1: string | null
  presentAddressLine2: string | null
  presentCity: string | null
  presentCountry: string | null
  permanentAddressLine1: string | null
  permanentAddressLine2: string | null
  permanentCity: string | null
  permanentCountry: string | null
  amlScreeningStatus: string | null
  amlCaseReference: string | null
  t24CustomerId: string | null
  t24AccountId: string | null
  t24SubmissionStatus: string | null
  validationErrors: string | null
  formDataJson: string | null
  inviteSentAt: string | null
  expireAt: string | null
  createdAt: string
  updatedAt: string
  hasCnicFrontImage: boolean
  hasCnicBackImage: boolean
  hasSelfieImage: boolean
}

export async function fetchBatchEmployees(
  batchRef: string,
  page: number,
  size: number,
): Promise<SpringPage<PortalBatchEmployeeRow>> {
  const { data } = await apiClient.get<SpringPage<PortalBatchEmployeeRow>>(
    `/batches/${encodeURIComponent(batchRef)}/employees`,
    { params: { page, size, sort: 'employeeRef,asc' } },
  )
  return data
}

export async function fetchBatchEmployeeDetail(
  batchRef: string,
  employeeRef: string,
): Promise<PortalEmployeeDetail> {
  const { data } = await apiClient.get<PortalEmployeeDetail>(
    `/batches/${encodeURIComponent(batchRef)}/employees/${encodeURIComponent(employeeRef)}`,
  )
  return data
}
