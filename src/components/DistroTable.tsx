import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useState, type MouseEvent } from "react";
import type { Distro } from "../types";
import { buildDistroUrl } from "../lib/tagBuilder";
import { useApp } from "../state/AppContext";

interface Props {
  distros: Distro[];
  onCopy: (distro: Distro) => void;
  onEdit: (distro: Distro) => void;
  onDelete: (distro: Distro) => void;
}

export const DistroTable = ({ distros, onCopy, onEdit, onDelete }: Props) => {
  const { state } = useApp();
  const catalog = state.paramsCatalog;
  const regions = state.regions;
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeDistro, setActiveDistro] = useState<Distro | null>(null);

  const openMenu = (event: MouseEvent<HTMLButtonElement>, distro: Distro) => {
    setMenuAnchor(event.currentTarget);
    setActiveDistro(distro);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setActiveDistro(null);
  };

  const handleEdit = () => {
    if (activeDistro) onEdit(activeDistro);
    closeMenu();
  };

  const handleDelete = () => {
    if (activeDistro) onDelete(activeDistro);
    closeMenu();
  };

  if (distros.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 6, textAlign: "center" }}
      >
        No distributions yet — click <strong>+ Add Distribution Tag</strong> to
        create one.
      </Typography>
    );
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Distribution Tag</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {distros.map((d) => {
            const url = buildDistroUrl(d, catalog, regions);
            return (
              <TableRow key={d.id} hover>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap>
                    {d.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 540 }}>
                  <Typography
                    variant="body2"
                    title={url}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {url}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                    <Tooltip title="Copy tag URL">
                      <IconButton
                        size="small"
                        onClick={() => onCopy(d)}
                        sx={{ color: "text.secondary" }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More actions">
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, d)}
                        sx={{ color: "text.secondary" }}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 0.5 },
          },
        }}
      >
        <MenuItem onClick={handleEdit}>Edit Tag</MenuItem>
        <MenuItem onClick={closeMenu}>Launch Test Page</MenuItem>
        <MenuItem onClick={closeMenu}>Launch Test Page (3rd Party Tag)</MenuItem>
        <MenuItem onClick={closeMenu}>View Report</MenuItem>
        <Divider />
        <MenuItem
          onClick={handleDelete}
          sx={{ color: "primary.main" }}
        >
          Delete Tag
        </MenuItem>
      </Menu>
    </>
  );
};
