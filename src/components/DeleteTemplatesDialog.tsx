import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onDeleted: (deletedIds: string[]) => void;
}

export const DeleteTemplatesDialog = ({ open, onClose, onDeleted }: Props) => {
  const { state, deleteTemplates } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelectedIds([]);
  }, [open]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    const names = selectedIds
      .map((id) => state.templates.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean);
    const confirmMsg = `Delete ${selectedIds.length} template${selectedIds.length === 1 ? "" : "s"}?\n\n${names.join(", ")}\n\nThis cannot be undone.`;
    if (window.confirm(confirmMsg)) {
      deleteTemplates(selectedIds);
      onDeleted(selectedIds);
      onClose();
    }
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: "background.paper", borderRadius: 1 },
      }}
    >
      <DialogTitle sx={{ pr: 6, py: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
          Delete Templates
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        {state.templates.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            No templates available.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select one or more templates to delete.
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              <List dense disablePadding>
                {state.templates.map((t) => {
                  const checked = selectedIds.includes(t.id);
                  return (
                    <ListItem
                      key={t.id}
                      disablePadding
                      onClick={() => toggleId(t.id)}
                      sx={{
                        cursor: "pointer",
                        borderBottom: 1,
                        borderColor: "divider",
                        "&:last-of-type": { borderBottom: 0 },
                        "&:hover": { backgroundColor: "action.hover" },
                        py: 0.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44, pl: 1 }}>
                        <Checkbox
                          edge="start"
                          checked={checked}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={t.name}
                        secondary={t.family.toUpperCase()}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          sx: { letterSpacing: "0.06em" },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={!hasSelection}
          sx={{
            color: hasSelection ? "primary.main" : "text.disabled",
          }}
        >
          {hasSelection
            ? `Delete Selected (${selectedIds.length})`
            : "Delete Selected"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
