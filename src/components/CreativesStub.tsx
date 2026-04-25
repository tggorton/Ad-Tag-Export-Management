import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { SectionHeader } from "./SectionHeader";

export const CreativesStub = () => (
  <Box>
    <SectionHeader
      title="Creatives"
      actions={
        <Button variant="outlined" color="primary" size="small">
          Add Creative
        </Button>
      }
    />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Creative ID</TableCell>
          <TableCell>Playback Mode</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <span>Weighting</span>
              <Tooltip title="Recalculate weights (visual only)">
                <IconButton size="small" sx={{ color: "text.secondary", p: 0.25 }}>
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell colSpan={5} align="center" sx={{ py: 4, borderBottom: 0 }}>
            <Typography variant="body2" color="text.secondary">
              No creatives associated
            </Typography>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </Box>
);
