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
  ParamFamilyKey,
  Region,
  Template,
  TemplateFamily,
} from "../types";
import { buildTagString } from "../lib/tagBuilder";
import { newId } from "../lib/ids";
import { ADVERTISER_OPTIONS } from "../lib/advertisers";
import { useApp } from "../state/AppContext";
import { TagPreview } from "./TagPreview";
import { ParamCheckboxGroup } from "./ParamCheckboxGroup";
import { CustomFieldsSection } from "./CustomFieldsSection";
import { DeleteTemplatesDialog } from "./DeleteTemplatesDialog";
import { ManageParamsDialog } from "./ManageParamsDialog";

interface ManageFormState {
  templateName: string;
  advertiserId: string; // "" means none / all advertisers
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

const emptyManageState = (): ManageFormState => ({
  templateName: "",
  advertiserId: "",
  family: "nexxen",
  region: "us-east-1",
  selectedParams: [],
  selectedCreativeParams: [],
  customKeyValues: [],
});

const templateToManageState = (t: Template): ManageFormState => ({
  templateName: t.name,
  advertiserId: t.advertiserId ?? "",
  family: t.family,
  region: t.region,
  selectedParams: [...t.selectedParams],
  selectedCreativeParams: [...t.selectedCreativeParams],
  customKeyValues: t.customKeyValues.map((kv) => ({ ...kv, id: newId() })),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const ManageTemplatesDialog = ({ open, onClose, onSaved }: Props) => {
  const { state, addTemplate, updateTemplate } = useApp();
  const catalog = state.paramsCatalog;

  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<ManageFormState>(emptyManageState);
  const [nameError, setNameError] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [manageParamsFamily, setManageParamsFamily] =
    useState<ParamFamilyKey | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedId("");
    setForm(emptyManageState());
    setNameError(false);
    setBulkDeleteOpen(false);
    setManageParamsFamily(null);
  }, [open]);

  const tagString = useMemo(
    () =>
      buildTagString(
        {
          family: form.family,
          selectedParams: form.selectedParams,
          selectedCreativeParams: form.selectedCreativeParams,
          customKeyValues: form.customKeyValues,
        },
        catalog,
      ),
    [form, catalog],
  );

  const update = <K extends keyof ManageFormState>(
    key: K,
    value: ManageFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedTemplate = useMemo(
    () => state.templates.find((t) => t.id === selectedId) ?? null,
    [selectedId, state.templates],
  );

  const handleTemplatePick = (id: string) => {
    setSelectedId(id);
    setNameError(false);
    if (!id) {
      setForm(emptyManageState());
      return;
    }
    const tpl = state.templates.find((t) => t.id === id);
    if (!tpl) return;
    setForm(templateToManageState(tpl));
  };

  const handleFamilyChange = (_: unknown, value: TemplateFamily) => {
    if (value === form.family) return;
    setForm((prev) => ({
      ...prev,
      family: value,
      selectedParams: [],
    }));
  };

  const handleNameChange = (value: string) => {
    update("templateName", value);
    if (nameError && value.trim().length > 0) setNameError(false);
  };

  const requireName = (): boolean => {
    if (form.templateName.trim().length > 0) return true;
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

  // Save New is enabled when there's any meaningful configuration to save.
  const hasAnySelection =
    form.selectedParams.length > 0 ||
    form.selectedCreativeParams.length > 0 ||
    form.customKeyValues.some((kv) => kv.key.trim().length > 0);

  // Update is enabled when the form has actually diverged from the loaded
  // template (including name + advertiser, since this view edits both).
  const hasChanges = useMemo(() => {
    if (!selectedTemplate) return false;
    if (form.templateName.trim() !== selectedTemplate.name) return true;
    if (form.advertiserId !== (selectedTemplate.advertiserId ?? ""))
      return true;
    if (form.family !== selectedTemplate.family) return true;
    if (form.region !== selectedTemplate.region) return true;
    const sameSet = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      const sa = [...a].sort();
      const sb = [...b].sort();
      return sa.every((v, i) => v === sb[i]);
    };
    if (!sameSet(form.selectedParams, selectedTemplate.selectedParams))
      return true;
    if (
      !sameSet(
        form.selectedCreativeParams,
        selectedTemplate.selectedCreativeParams,
      )
    )
      return true;
    if (form.customKeyValues.length !== selectedTemplate.customKeyValues.length)
      return true;
    const formKvs = form.customKeyValues
      .map((kv) => JSON.stringify([kv.key, kv.value]))
      .sort();
    const origKvs = selectedTemplate.customKeyValues
      .map((kv) => JSON.stringify([kv.key, kv.value]))
      .sort();
    return formKvs.some((v, i) => v !== origKvs[i]);
  }, [form, selectedTemplate]);

  const handleSaveNew = () => {
    if (!requireName()) return;
    const newTemplate: Template = {
      id: `tpl-${newId().slice(0, 8)}`,
      name: form.templateName.trim(),
      family: form.family,
      region: form.region,
      selectedParams: form.selectedParams,
      selectedCreativeParams: form.selectedCreativeParams,
      customKeyValues: form.customKeyValues,
      advertiserId: form.advertiserId || undefined,
    };
    addTemplate(newTemplate);
    setSelectedId(newTemplate.id);
    setForm(templateToManageState(newTemplate));
    onSaved?.(`Saved template "${newTemplate.name}"`);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    if (!requireName()) return;
    const updated: Template = {
      ...selectedTemplate,
      name: form.templateName.trim(),
      family: form.family,
      region: form.region,
      selectedParams: form.selectedParams,
      selectedCreativeParams: form.selectedCreativeParams,
      customKeyValues: form.customKeyValues,
      advertiserId: form.advertiserId || undefined,
    };
    updateTemplate(updated);
    // Re-sync form so hasChanges flips back to false on the now-saved state.
    setForm(templateToManageState(updated));
    onSaved?.(`Updated template "${updated.name}"`);
  };

  const handleBulkDeleted = (ids: string[]) => {
    if (selectedId && ids.includes(selectedId)) {
      setSelectedId("");
      setForm(emptyManageState());
    }
    onSaved?.(
      `Deleted ${ids.length} template${ids.length === 1 ? "" : "s"}`,
    );
  };

  const familyTitle = form.family === "nexxen" ? "Nexxen Params" : "TTD Params";

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
          Manage Templates
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
            label="Template Name"
            value={form.templateName}
            onChange={(e) => handleNameChange(e.target.value)}
            size="medium"
            required
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            error={nameError}
            helperText={nameError ? "Template Name is required" : undefined}
            inputRef={nameInputRef}
          />

          <Stack spacing={0.5}>
            <TextField
              select
              label="Tag Template"
              value={selectedId}
              onChange={(e) => handleTemplatePick(e.target.value)}
              size="medium"
              fullWidth
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        Select a template to edit, or leave blank to create new
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
                  {t.advertiserId ? ` — ${t.advertiserId}` : ""}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                onClick={() => setBulkDeleteOpen(true)}
                sx={{
                  color: "text.secondary",
                  textTransform: "none",
                  fontSize: 12,
                  minWidth: 0,
                  px: 0.5,
                }}
              >
                Delete Templates
              </Button>
            </Box>
          </Stack>

          <TextField
            select
            label="Advertiser"
            value={form.advertiserId}
            onChange={(e) => update("advertiserId", e.target.value)}
            size="medium"
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Optional — limits this template's visibility to a specific advertiser"
          >
            <MenuItem value="">None (all advertisers)</MenuItem>
            {ADVERTISER_OPTIONS.map((adv) => (
              <MenuItem key={adv} value={adv}>
                {adv}
              </MenuItem>
            ))}
          </TextField>

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
                onEditRequest={() => setManageParamsFamily(form.family)}
              />
            </Box>
          </Box>

          <ParamCheckboxGroup
            title="Creative Params"
            params={catalog.creative}
            selectedIds={form.selectedCreativeParams}
            onChange={(next) => update("selectedCreativeParams", next)}
            onEditRequest={() => setManageParamsFamily("creative")}
          />

          <CustomFieldsSection
            items={form.customKeyValues}
            onChange={(items) => update("customKeyValues", items)}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5, gap: 0.5 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleSaveNew}
          disabled={!hasAnySelection}
          sx={{
            color: hasAnySelection ? "primary.main" : "text.disabled",
          }}
        >
          Save New Template
        </Button>
        {selectedTemplate && (
          <Button
            onClick={handleUpdate}
            disabled={!hasChanges}
            sx={{
              color: hasChanges ? "primary.main" : "text.disabled",
            }}
          >
            Update
          </Button>
        )}
      </DialogActions>
      <DeleteTemplatesDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onDeleted={handleBulkDeleted}
      />
      <ManageParamsDialog
        open={Boolean(manageParamsFamily)}
        family={manageParamsFamily}
        onClose={() => setManageParamsFamily(null)}
        onSaved={onSaved}
      />
    </Dialog>
  );
};
