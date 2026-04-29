import { Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { type FormEvent, useRef, useState } from 'react'
import { apiClient } from '../api/client'
import { usePortalOutletContext } from '../portalOutletContext'

const previewRules = [
  ['fullName', 'Required text', 'Required'],
  ['cnic', '13 digits, dashed display', 'Required'],
  ['mobile', '03XXXXXXXXX', 'Required'],
  ['department', 'Text', 'Optional'],
]

export function UploadBatchPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { session } = usePortalOutletContext()
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (session?.corporateClientId == null) {
      setUploadMsg('No corporate client is attached to this account.')
      return
    }
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setUploadMsg('Choose an Excel file first.')
      return
    }
    setUploadBusy(true)
    setUploadMsg(null)
    try {
      const body = new FormData()
      body.append('corporateClientId', String(session.corporateClientId))
      body.append('file', file)
      await apiClient.post('/batches/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadMsg('Upload accepted. Continue with batch preview and confirm invite dispatch.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileLabel(null)
    } catch {
      setUploadMsg('Upload failed. Confirm ADMIN role and valid Excel format.')
    } finally {
      setUploadBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h1">
        Upload New Batch
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: '#059669', color: '#fff' }}>
            1 Upload
          </Typography>
          <Typography variant="body2" color="text.secondary">
            2 Preview & Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3 Confirm & Send
          </Typography>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Step 1: Upload file
        </Typography>
        <Box component="form" onSubmit={onUpload}>
          <Stack spacing={2}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(ev) => setFileLabel(ev.target.files?.[0]?.name ?? null)}
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Button type="button" variant="outlined" onClick={() => fileInputRef.current?.click()}>
                Choose Excel
              </Button>
              <Typography variant="body2" color="text.secondary">
                {fileLabel ?? 'No file selected'}
              </Typography>
            </Stack>
            {uploadMsg ? <Alert severity={uploadMsg.includes('failed') ? 'error' : 'info'}>{uploadMsg}</Alert> : null}
            <Button type="submit" disabled={uploadBusy}>
              {uploadBusy ? 'Uploading...' : 'Upload'}
            </Button>
          </Stack>
        </Box>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Step 2: Preview and map columns
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Backend preview/validate API is pending. This screen is ready for integration.
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Validation rules
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Column</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Required</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {previewRules.map((rule) => (
              <TableRow key={rule[0]}>
                <TableCell>{rule[0]}</TableCell>
                <TableCell>{rule[1]}</TableCell>
                <TableCell>{rule[2]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  )
}
