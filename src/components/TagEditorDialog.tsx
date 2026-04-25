import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useState } from "react";
import type {
  CustomKeyValue,
  CustomMacro,
  Region,
  TemplateFamily,
} from "../types";
import { CREATIVE_PARAMS, NEXXEN_PARAMS, TTD_PARAMS } from "../lib/paramCatalog";
import { buildTagString } from "../lib/tagBuilder";
import { TagPreview } from "./TagPreview";
import { ParamCheckboxGroup } from "./ParamCheckboxGroup";
import { CustomKeyValueList } from "./CustomKeyValueList";
import { CustomMacroList } from "./CustomMacroList";

export type EditorMode = "distro" | "template";

export interface EditorState {
  name: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
  customMacros: CustomMacro[];
}

interface Props {
  open: boolean;
  mode: EditorMode;
  title: string;
  initialState: EditorState;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (state: EditorState) => void;
}

const REGIONS: Array<{ value: Region; label: string }> = [
  { value: "us-east-1", label: "Default (us-east-1)" },
  { value: "australia", label: "Australia" },
  { value: "europe", label: "Europe" },
];

export const TagEditorDialog = ({
  open,
  mode,
  title,
  initialState,
  submitLabel = "Add",
  onClose,
  onSubmit,
}: Props) => {
  const [state, setState] = useState<EditorState>(initialState);

  useEffect(() => {
    if (open) setState(initialState);
  }, [open, initialState]);

  const tagString = useMemo(() => buildTagString(state), [state]);

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleFamilyChange = (_: unknown, value: TemplateFamily) => {
    if (value === state.family) return;
    setState((prev) => ({
      ...prev,
      family: value,
      // Selected params are family-specific — clear them when switching tabs.
      // Creative params, custom KVs, and macros persist since they're shared.
      selectedParams: [],
    }));
  };

  const nameLabel = mode === "template" ? "Template-Name" : "Distro Name";
  const isValid = state.name.trim().length > 0;
  const familyTitle = state.family === "nexxen" ? "Nexxen Params" : "TTD Params";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          backgroundImage: "none",
          borderRadius: 1,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, pt: 3, pb: 2 }}>
        <Typography
          variant="h4"
          component="div"
          sx={{ color: "primary.main", fontWeight: 400 }}
        >
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
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={3}>
          <TextField
            label={nameLabel}
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
          />
          <FormControl>
            <FormLabel
              sx={{
                color: "primary.main",
                "&.Mui-focused": { color: "primary.main" },
                fontSize: 14,
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              Region
            </FormLabel>
            <RadioGroup
              row
              value={state.region}
              onChange={(e) => update("region", e.target.value as Region)}
            >
              {REGIONS.map((r) => (
                <FormControlLabel
                  key={r.value}
                  value={r.value}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2">{r.label}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <TagPreview tagString={tagString} />
          <Box>
            <Tabs
              value={state.family}
              onChange={handleFamilyChange}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab value="nexxen" label="NEXXEN" />
              <Tab value="ttd" label="TTD" />
            </Tabs>
            <Box sx={{ pt: 3 }}>
              <ParamCheckboxGroup
                title={familyTitle}
                params={state.family === "nexxen" ? NEXXEN_PARAMS : TTD_PARAMS}
                selectedIds={state.selectedParams}
                onChange={(next) => update("selectedParams", next)}
                showToolbar
              />
            </Box>
          </Box>
          <ParamCheckboxGroup
            title="Creative Params"
            params={CREATIVE_PARAMS}
            selectedIds={state.selectedCreativeParams}
            onChange={(next) => update("selectedCreativeParams", next)}
          />
          <Stack spacing={1.5}>
            <CustomKeyValueList
              items={state.customKeyValues}
              onChange={(items) => update("customKeyValues", items)}
            />
            <CustomMacroList
              items={state.customMacros}
              onChange={(items) => update("customMacros", items)}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(state)}
          color={isValid ? "primary" : "inherit"}
          disabled={!isValid}
          sx={{
            color: isValid ? "primary.main" : "text.disabled",
          }}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
