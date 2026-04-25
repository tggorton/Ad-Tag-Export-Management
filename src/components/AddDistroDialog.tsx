import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { useApp } from "../state/AppContext";
import type { Distro, Template } from "../types";
import { newId } from "../lib/ids";
import { TagEditorDialog, type EditorState } from "./TagEditorDialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

type AdminChoice = "choose" | "create";

export const AddDistroDialog = ({ open, onClose }: Props) => {
  const { state, addDistro, addTemplate, nextDistributionId } = useApp();
  const isAdmin = state.role === "admin";

  const [adminChoice, setAdminChoice] = useState<AdminChoice>("choose");
  const [templateId, setTemplateId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [editorMode, setEditorMode] = useState<"distro" | "template">("distro");
  const [editorTitle, setEditorTitle] = useState("Add New Tag");

  useEffect(() => {
    if (open) {
      setAdminChoice("choose");
      setTemplateId("");
    }
  }, [open]);

  const findTemplate = (id: string): Template | undefined =>
    state.templates.find((t) => t.id === id);

  const generateDistroName = (template: Template): string => {
    const existingForTemplate = state.distros.filter(
      (d) => d.templateId === template.id,
    ).length;
    return `${template.name} – Distro ${existingForTemplate + 1}`;
  };

  const handleNext = () => {
    if (isAdmin && adminChoice === "create") {
      setEditorMode("template");
      setEditorTitle("Create Tag Template");
      setEditorState({
        name: "",
        family: "nexxen",
        region: "us-east-1",
        selectedParams: [],
        selectedCreativeParams: [],
        customKeyValues: [],
        customMacros: [],
      });
      setEditorOpen(true);
      return;
    }

    const tpl = findTemplate(templateId);
    if (!tpl) return;
    setEditorMode("distro");
    setEditorTitle("Add New Tag");
    setEditorState({
      name: generateDistroName(tpl),
      family: tpl.family,
      region: tpl.region,
      selectedParams: [...tpl.selectedParams],
      selectedCreativeParams: [...tpl.selectedCreativeParams],
      customKeyValues: tpl.customKeyValues.map((kv) => ({ ...kv, id: newId() })),
      customMacros: tpl.customMacros.map((m) => ({ ...m, id: newId() })),
    });
    setEditorOpen(true);
  };

  const handleEditorSubmit = (next: EditorState) => {
    if (editorMode === "template") {
      const newTemplate: Template = {
        id: `tpl-${newId().slice(0, 8)}`,
        name: next.name.trim(),
        family: next.family,
        region: next.region,
        selectedParams: next.selectedParams,
        selectedCreativeParams: next.selectedCreativeParams,
        customKeyValues: next.customKeyValues,
        customMacros: next.customMacros,
      };
      addTemplate(newTemplate);
    } else {
      const distro: Distro = {
        id: newId(),
        name: next.name.trim(),
        templateId,
        family: next.family,
        region: next.region,
        selectedParams: next.selectedParams,
        selectedCreativeParams: next.selectedCreativeParams,
        customKeyValues: next.customKeyValues,
        customMacros: next.customMacros,
        distributionId: nextDistributionId(),
        lineItemId: 4387,
        createdAt: new Date().toISOString(),
      };
      addDistro(distro);
    }
    setEditorOpen(false);
    onClose();
  };

  const nextEnabled =
    isAdmin && adminChoice === "create" ? true : Boolean(templateId);

  return (
    <>
      <Dialog
        open={open && !editorOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: "background.paper", borderRadius: 1 },
        }}
      >
        <DialogTitle sx={{ pr: 6, py: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
            Add New Tag
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
          <Stack spacing={3} sx={{ mt: 1 }}>
            {isAdmin && (
              <FormControl>
                <FormLabel sx={{ fontSize: 13, mb: 0.5, color: "text.primary" }}>
                  Tag Type
                </FormLabel>
                <RadioGroup
                  row
                  value={adminChoice}
                  onChange={(e) => setAdminChoice(e.target.value as AdminChoice)}
                >
                  <FormControlLabel
                    value="choose"
                    control={<Radio size="small" />}
                    label="Choose Template"
                  />
                  <FormControlLabel
                    value="create"
                    control={<Radio size="small" />}
                    label="Create New Template"
                  />
                </RadioGroup>
              </FormControl>
            )}
            <TextField
              select
              label="Tag Template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              size="medium"
              fullWidth
              disabled={isAdmin && adminChoice === "create"}
              InputLabelProps={{ shrink: true }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>
                        Select Template
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={!nextEnabled}
            sx={{ color: nextEnabled ? "primary.main" : "text.disabled" }}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>
      {editorState && (
        <TagEditorDialog
          open={editorOpen}
          mode={editorMode}
          title={editorTitle}
          initialState={editorState}
          submitLabel="Add"
          onClose={() => setEditorOpen(false)}
          onSubmit={handleEditorSubmit}
        />
      )}
    </>
  );
};
