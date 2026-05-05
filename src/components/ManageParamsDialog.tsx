import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import { newId } from "../lib/ids";
import type { ParamFamilyKey } from "../types";

interface Props {
  open: boolean;
  family: ParamFamilyKey | null;
  onClose: () => void;
}

const TITLES: Record<ParamFamilyKey, string> = {
  nexxen: "Manage Nexxen Params",
  ttd: "Manage TTD Params",
  creative: "Manage Creative Params",
};

export const ManageParamsDialog = ({ open, family, onClose }: Props) => {
  const { state, addParam, updateParam, deleteParam } = useApp();
  const [addMode, setAddMode] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newOutput, setNewOutput] = useState("");

  useEffect(() => {
    if (!open) return;
    setAddMode(false);
    setNewLabel("");
    setNewOutput("");
  }, [open]);

  if (!family) return null;

  const params = state.paramsCatalog[family];
  const title = TITLES[family];

  const handleLabelEdit = (id: string, label: string) => {
    const existing = params.find((p) => p.id === id);
    if (!existing) return;
    updateParam(family, { ...existing, label });
  };

  const handleOutputEdit = (id: string, output: string) => {
    const existing = params.find((p) => p.id === id);
    if (!existing) return;
    updateParam(family, { ...existing, output });
  };

  const handleDelete = (id: string, label: string) => {
    if (
      window.confirm(
        `Delete parameter "${label}"? Existing templates and distros that referenced it will silently lose this output. This cannot be undone.`,
      )
    ) {
      deleteParam(family, id);
    }
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addParam(family, {
      id: `param-${newId().slice(0, 8)}`,
      label: newLabel.trim(),
      output: newOutput.trim(),
    });
    setNewLabel("");
    setNewOutput("");
    setAddMode(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: "background.paper", borderRadius: 1 },
      }}
    >
      <DialogTitle sx={{ pr: 6, py: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
          {title}
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
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Edit any field to update a parameter immediately. Removing a
            parameter affects this catalog only — selections on existing
            templates/distros that referenced it stop emitting output.
          </Typography>
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              maxHeight: 360,
              overflowY: "auto",
              p: 1.5,
            }}
          >
            {params.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No parameters yet — click <strong>+ Add Param</strong> below.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {params.map((p) => (
                  <Stack
                    key={p.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <TextField
                      label="Label"
                      size="small"
                      value={p.label}
                      onChange={(e) => handleLabelEdit(p.id, e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Output"
                      size="small"
                      value={p.output}
                      onChange={(e) => handleOutputEdit(p.id, e.target.value)}
                      sx={{
                        flex: 2,
                        "& .MuiInputBase-input": {
                          fontFamily: "ui-monospace, monospace",
                          fontSize: 12,
                        },
                      }}
                    />
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(p.id, p.label)}
                        sx={{ color: "text.secondary" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
          {addMode ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Label"
                size="small"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                sx={{ flex: 1 }}
                autoFocus
              />
              <TextField
                label="Output"
                size="small"
                value={newOutput}
                onChange={(e) => setNewOutput(e.target.value)}
                placeholder="&key=value"
                sx={{
                  flex: 2,
                  "& .MuiInputBase-input": {
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 12,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleAdd}
                disabled={!newLabel.trim()}
              >
                Add
              </Button>
              <Button
                size="small"
                onClick={() => setAddMode(false)}
                color="primary"
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <Box>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setAddMode(true)}
              >
                + Add Param
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: "primary.main" }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
