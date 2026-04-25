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
import type { CustomKeyValue } from "../types";
import { newId } from "../lib/ids";

interface Props {
  items: CustomKeyValue[];
  onChange: (items: CustomKeyValue[]) => void;
}

export const CustomKeyValueList = ({ items, onChange }: Props) => {
  const [showInputs, setShowInputs] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (!key.trim()) return;
    onChange([...items, { id: newId(), key: key.trim(), value: value.trim() }]);
    setKey("");
    setValue("");
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((kv) => kv.id !== id));
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
        + Add Key Value
      </Button>
      <Collapse in={showInputs}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            label="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            fullWidth
          />
          <TextField
            size="small"
            label="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
          />
          <Tooltip title="Add">
            <span>
              <IconButton
                color="primary"
                onClick={handleAdd}
                disabled={!key.trim()}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Collapse>
      {items.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
          {items.map((kv) => (
            <Chip
              key={kv.id}
              label={
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {kv.key}={kv.value}
                </Typography>
              }
              size="small"
              onDelete={() => handleDelete(kv.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};
