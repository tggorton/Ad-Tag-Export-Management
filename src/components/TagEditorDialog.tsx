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
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CustomKeyValue,
  Distro,
  Region,
  Template,
  TemplateFamily,
} from "../types";
import { buildTagString } from "../lib/tagBuilder";
import { newId } from "../lib/ids";
import { isVisibleForCurrentAdvertiser } from "../lib/advertisers";
import { useApp } from "../state/AppContext";
import { TagPreview } from "./TagPreview";
import { ParamCheckboxGroup } from "./ParamCheckboxGroup";
import { CustomFieldsSection } from "./CustomFieldsSection";

interface FormState {
  name: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
}

const REGIONS: Array<{ value: Region; label: string }> = [
  { value: "us-east-1", label: "Default (us-east-1)" },
  { value: "australia", label: "Australia" },
  { value: "europe", label: "Europe" },
];

const emptyFormState = (): FormState => ({
  name: "",
  family: "nexxen",
  region: "us-east-1",
  selectedParams: [],
  selectedCreativeParams: [],
  customKeyValues: [],
});

const distroToFormState = (d: Distro): FormState => ({
  name: d.name,
  family: d.family,
  region: d.region,
  selectedParams: [...d.selectedParams],
  selectedCreativeParams: [...d.selectedCreativeParams],
  customKeyValues: d.customKeyValues.map((kv) => ({ ...kv })),
});

type TemplateFormFields = Omit<FormState, "name">;

const templateToFormFields = (t: Template): TemplateFormFields => ({
  family: t.family,
  region: t.region,
  selectedParams: [...t.selectedParams],
  selectedCreativeParams: [...t.selectedCreativeParams],
  customKeyValues: t.customKeyValues.map((kv) => ({ ...kv, id: newId() })),
});

interface Props {
  open: boolean;
  /** Pass an existing distro to open the editor in "edit" mode. */
  editingDistro?: Distro | null;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const TagEditorDialog = ({
  open,
  editingDistro,
  onClose,
  onSaved,
}: Props) => {
  const { state, addDistro, updateDistro, nextDistributionId } = useApp();
  const catalog = state.paramsCatalog;
  const isEditMode = Boolean(editingDistro);

  const [templateId, setTemplateId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editingDistro) {
      setForm(distroToFormState(editingDistro));
    } else {
      setForm(emptyFormState());
    }
    setTemplateId("");
    setNameError(false);
  }, [open, editingDistro]);

  const tagString = useMemo(() => buildTagString(form, catalog), [form, catalog]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFamilyChange = (_: unknown, value: TemplateFamily) => {
    if (value === form.family) return;
    setForm((prev) => ({
      ...prev,
      family: value,
      selectedParams: [], // family-specific params don't carry across tabs
    }));
  };

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    // The distro-name field is the user's responsibility — never overwrite
    // it when a template is picked or cleared.
    if (!newTemplateId) {
      setForm((prev) => ({ ...emptyFormState(), name: prev.name }));
      return;
    }
    const tpl = state.templates.find((t) => t.id === newTemplateId);
    if (!tpl) return;
    setForm((prev) => ({ name: prev.name, ...templateToFormFields(tpl) }));
  };

  const requireName = (): boolean => {
    if (form.name.trim().length > 0) return true;
    setNameError(true);
    nameInputRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    setTimeout(
      () => nameInputRef.current?.focus({ preventScroll: true }),
      120,
    );
    return false;
  };

  const handleNameChange = (value: string) => {
    update("name", value);
    if (nameError && value.trim().length > 0) setNameError(false);
  };

  const showTemplateSelector = !isEditMode;
  const dialogTitle = isEditMode ? "Edit Distribution" : "Add New Tag";
  const submitLabel = isEditMode ? "Save" : "Add";
  const familyTitle = form.family === "nexxen" ? "Nexxen Params" : "TTD Params";

  // Distro creators (reg users + admins on Add Distribution Tag) only see
  // templates that are unscoped or scoped to the current advertiser.
  const visibleTemplates = useMemo(
    () =>
      state.templates.filter((t) =>
        isVisibleForCurrentAdvertiser(t.advertiserId),
      ),
    [state.templates],
  );

  const handleSubmit = () => {
    if (!requireName()) return;
    if (isEditMode && editingDistro) {
      updateDistro({
        ...editingDistro,
        name: form.name.trim(),
        family: form.family,
        region: form.region,
        selectedParams: form.selectedParams,
        selectedCreativeParams: form.selectedCreativeParams,
        customKeyValues: form.customKeyValues,
      });
      onSaved?.(`Updated "${form.name.trim()}"`);
    } else {
      const distro: Distro = {
        id: newId(),
        name: form.name.trim(),
        templateId: templateId || "manual",
        family: form.family,
        region: form.region,
        selectedParams: form.selectedParams,
        selectedCreativeParams: form.selectedCreativeParams,
        customKeyValues: form.customKeyValues,
        distributionId: nextDistributionId(),
        lineItemId: 4387,
        createdAt: new Date().toISOString(),
      };
      addDistro(distro);
      onSaved?.(`Added "${distro.name}"`);
    }
    onClose();
  };

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
          {dialogTitle}
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
            label="Distro Name"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            error={nameError}
            helperText={nameError ? "Distro Name is required" : undefined}
            inputRef={nameInputRef}
          />

          {showTemplateSelector && (
            <TextField
              select
              label="Tag Template"
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              size="medium"
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        Select Template (optional)
                      </span>
                    );
                  }
                  const tpl = state.templates.find((t) => t.id === selected);
                  return tpl?.name ?? "";
                },
              }}
            >
              {visibleTemplates.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          )}

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
              value={form.region}
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
              value={form.family}
              onChange={handleFamilyChange}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab value="nexxen" label="NEXXEN" />
              <Tab value="ttd" label="TTD" />
            </Tabs>
            <Box sx={{ pt: 3 }}>
              <ParamCheckboxGroup
                title={familyTitle}
                params={catalog[form.family]}
                selectedIds={form.selectedParams}
                onChange={(next) => update("selectedParams", next)}
              />
            </Box>
          </Box>

          <ParamCheckboxGroup
            title="Creative Params"
            params={catalog.creative}
            selectedIds={form.selectedCreativeParams}
            onChange={(next) => update("selectedCreativeParams", next)}
          />

          <CustomFieldsSection
            items={form.customKeyValues}
            onChange={(items) => update("customKeyValues", items)}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} sx={{ color: "primary.main" }}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
