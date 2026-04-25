import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import type { ParamDef } from "../lib/paramCatalog";

interface Props {
  title: string;
  params: ParamDef[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  /** When true, render the prototype +/trash/pencil toolbar next to the title (visual fidelity, non-functional). */
  showToolbar?: boolean;
  /** When true, the title is rendered in the primary color (matches "Nexxen Params" / "Creative Params" Figma styling). */
  primaryTitle?: boolean;
}

export const ParamCheckboxGroup = ({
  title,
  params,
  selectedIds,
  onChange,
  showToolbar = false,
  primaryTitle = true,
}: Props) => {
  const allSelected = params.every((p) => selectedIds.includes(p.id));
  const someSelected = params.some((p) => selectedIds.includes(p.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange(selectedIds.filter((id) => !params.some((p) => p.id === id)));
    } else {
      const merged = new Set([...selectedIds, ...params.map((p) => p.id)]);
      onChange(Array.from(merged));
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: primaryTitle ? "primary.main" : "text.primary",
            fontWeight: 500,
            fontSize: 20,
          }}
        >
          {title}
        </Typography>
        {showToolbar && (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Add (visual only)">
              <IconButton size="small" sx={{ color: "text.primary" }}>
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete (visual only)">
              <IconButton size="small" sx={{ color: "text.primary" }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit (visual only)">
              <IconButton size="small" sx={{ color: "text.primary" }}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onChange={toggleAll}
            />
          }
          label={<Typography variant="body2">Select All</Typography>}
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          rowGap: 0.5,
          columnGap: 1,
        }}
      >
        {params.map((p) => (
          <FormControlLabel
            key={p.id}
            control={
              <Checkbox
                size="small"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
              />
            }
            label={<Typography variant="body2">{p.label}</Typography>}
          />
        ))}
      </Box>
    </Box>
  );
};
