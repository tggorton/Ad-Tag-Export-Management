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
import { useEffect, useMemo, useState } from "react";
import type {
  CustomKeyValue,
  Distro,
  Region,
  Template,
  TemplateFamily,
} from "../types";
import { CREATIVE_PARAMS, NEXXEN_PARAMS, TTD_PARAMS } from "../lib/paramCatalog";
import { buildTagString } from "../lib/tagBuilder";
import { newId } from "../lib/ids";
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

const templateToFormState = (t: Template, autoName: string): FormState => ({
  name: autoName,
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
  const {
    state,
    addDistro,
    updateDistro,
    addTemplate,
    updateTemplate,
    nextDistributionId,
  } = useApp();
  const isAdmin = state.role === "admin";
  const isEditMode = Boolean(editingDistro);

  const [templateId, setTemplateId] = useState<string>("");
  const [form, setForm] = useState<FormState>(emptyFormState);

  // Reset every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editingDistro) {
      setForm(distroToFormState(editingDistro));
    } else {
      setForm(emptyFormState());
    }
    setTemplateId("");
  }, [open, editingDistro]);

  const tagString = useMemo(() => buildTagString(form), [form]);

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

  const generateDistroName = (tpl: Template): string => {
    const existingForTemplate = state.distros.filter(
      (d) => d.templateId === tpl.id,
    ).length;
    return `${tpl.name} – Distro ${existingForTemplate + 1}`;
  };

  const handleTemplateChange = (newTemplateId: string) => {
    setTemplateId(newTemplateId);
    if (!newTemplateId) {
      setForm(emptyFormState());
      return;
    }
    const tpl = state.templates.find((t) => t.id === newTemplateId);
    if (!tpl) return;
    setForm(templateToFormState(tpl, generateDistroName(tpl)));
  };

  const showTemplateSelector = !isEditMode;
  const dialogTitle = isEditMode ? "Edit Distribution" : "Add New Tag";
  const submitLabel = isEditMode ? "Save" : "Add";
  const isValid = form.name.trim().length > 0;
  const familyTitle = form.family === "nexxen" ? "Nexxen Params" : "TTD Params";

  // Admin in add mode gets a 3rd action button. Label depends on whether a
  // template is currently selected from the dropdown.
  const isAdminAddMode = isAdmin && !isEditMode;
  const isUpdatingTemplate = isAdminAddMode && Boolean(templateId);
  const templateActionLabel = isUpdatingTemplate
    ? "Update Template"
    : "Save Template";
  // Updating preserves the existing template's name; saving a new one needs a name.
  const canSaveTemplate = isUpdatingTemplate || form.name.trim().length > 0;

  const handleSubmit = () => {
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

  const handleTemplateAction = () => {
    if (isUpdatingTemplate) {
      const existing = state.templates.find((t) => t.id === templateId);
      if (!existing) return;
      updateTemplate({
        ...existing,
        // Preserve existing name and id; just refresh the configuration.
        family: form.family,
        region: form.region,
        selectedParams: form.selectedParams,
        selectedCreativeParams: form.selectedCreativeParams,
        customKeyValues: form.customKeyValues,
      });
      onSaved?.(`Updated template "${existing.name}"`);
    } else {
      const newTemplate: Template = {
        id: `tpl-${newId().slice(0, 8)}`,
        name: form.name.trim(),
        family: form.family,
        region: form.region,
        selectedParams: form.selectedParams,
        selectedCreativeParams: form.selectedCreativeParams,
        customKeyValues: form.customKeyValues,
      };
      addTemplate(newTemplate);
      onSaved?.(`Saved template "${newTemplate.name}"`);
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
            onChange={(e) => update("name", e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
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
              {state.templates.map((t) => (
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
                params={form.family === "nexxen" ? NEXXEN_PARAMS : TTD_PARAMS}
                selectedIds={form.selectedParams}
                onChange={(next) => update("selectedParams", next)}
                showToolbar
              />
            </Box>
          </Box>

          <ParamCheckboxGroup
            title="Creative Params"
            params={CREATIVE_PARAMS}
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
        {isAdminAddMode && (
          <Button
            onClick={handleTemplateAction}
            disabled={!canSaveTemplate}
            sx={{
              color: canSaveTemplate ? "primary.main" : "text.disabled",
            }}
          >
            {templateActionLabel}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
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
