import {
  Alert,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

const rows = [
  {
    employee: 'Ayesha Khan',
    phone: '0300-1234567',
    batchId: 'BAT-ENG-20260429-001',
    status: 'FAILED',
    action: 'Edit Phone + Resend',
  },
  {
    employee: 'Ali Raza',
    phone: '0301-1112233',
    batchId: 'BAT-ENG-20260429-001',
    status: 'PENDING',
    action: 'Resend SMS',
  },
]

export function InviteManagementPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h1">
        Invite Management
      </Typography>
      <Alert severity="warning">
        1 failed invite detected. Use bulk resend after fixing invalid phone numbers.
      </Alert>
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#EFF6FF', borderColor: '#BFDBFE' }}>
        <Typography variant="body2" sx={{ color: '#1D4ED8', fontWeight: 600 }}>
          2 rows selected · Resend Selected
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField size="small" fullWidth placeholder="Search employee, phone, batch..." />
          <Button variant="outlined">All</Button>
          <Button variant="outlined">Pending</Button>
          <Button variant="outlined" color="error">
            Failed
          </Button>
          <Button color="error">Bulk Resend</Button>
        </Stack>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Batch ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.employee}-${row.batchId}`} hover>
                <TableCell>{row.employee}</TableCell>
                <TableCell>{row.phone}</TableCell>
                <TableCell>
                  <Typography component="code" variant="body2">
                    {row.batchId}
                  </Typography>
                </TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined">
                    {row.action}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary">
        Cross-batch invite APIs (search, per-row resend, phone update, bulk resend) are pending backend delivery.
      </Typography>
    </Stack>
  )
}
