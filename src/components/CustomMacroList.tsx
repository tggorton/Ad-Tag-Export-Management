import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useState } from "react";
import type { CustomMacro } from "../types";
import { newId } from "../lib/ids";

interface Props {
  items: CustomMacro[];
  onChange: (items: CustomMacro[]) => void;
}

export const CustomMacroList = ({ items, onChange }: Props) => {
  const [showInputs, setShowInputs] = useState(false);
  const [macro, setMacro] = useState("");
  const [token, setToken] = useState("");

  const handleAdd = () => {
    if (!macro.trim()) return;
    onChange([
      ...items,
      { id: newId(), macro: macro.trim(), token: token.trim() },
    ]);
    setMacro("");
    setToken("");
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((m) => m.id !== id));
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setShowInputs((v) => !v)}
        sx={{ borderRadius: 1 }}
      >
        + Add Macro
      </Button>
      <Collapse in={showInputs}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            label="Macro"
            value={macro}
            onChange={(e) => setMacro(e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            fullWidth
          />
          <Tooltip title="Add">
            <span>
              <IconButton
                color="primary"
                onClick={handleAdd}
                disabled={!macro.trim()}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Collapse>
      {items.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
          {items.map((m) => (
            <Chip
              key={m.id}
              label={
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {m.macro}={m.token}
                </Typography>
              }
              size="small"
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
