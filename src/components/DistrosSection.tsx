import { Box, Button, Snackbar, Stack } from "@mui/material";
import { useState } from "react";
import { useApp } from "../state/AppContext";
import type { Distro } from "../types";
import { buildDistroUrl } from "../lib/tagBuilder";
import { downloadCsv } from "../lib/csvExport";
import { AddDistroDialog } from "./AddDistroDialog";
import { DistroTable } from "./DistroTable";
import { TagEditorDialog, type EditorState } from "./TagEditorDialog";
import { SectionHeader } from "./SectionHeader";

export const DistrosSection = () => {
  const { state, removeDistro, updateDistro } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Distro | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const handleCopy = async (distro: Distro) => {
    await navigator.clipboard.writeText(buildDistroUrl(distro));
    setSnack(`Copied tag URL for "${distro.name}"`);
  };

  const handleDelete = (distro: Distro) => {
    if (
      window.confirm(`Delete distribution "${distro.name}"? This cannot be undone.`)
    ) {
      removeDistro(distro.id);
      setSnack(`Deleted "${distro.name}"`);
    }
  };

  const handleExport = () => {
    if (state.distros.length === 0) {
      setSnack("No distributions to export");
      return;
    }
    downloadCsv(state.distros);
    setSnack(`Exported ${state.distros.length} distribution(s) to CSV`);
  };

  const editorInitial: EditorState | null = editing
    ? {
        name: editing.name,
        family: editing.family,
        region: editing.region,
        selectedParams: [...editing.selectedParams],
        selectedCreativeParams: [...editing.selectedCreativeParams],
        customKeyValues: editing.customKeyValues.map((kv) => ({ ...kv })),
        customMacros: editing.customMacros.map((m) => ({ ...m })),
      }
    : null;

  const handleEditSubmit = (next: EditorState) => {
    if (!editing) return;
    updateDistro({
      ...editing,
      name: next.name.trim(),
      family: next.family,
      region: next.region,
      selectedParams: next.selectedParams,
      selectedCreativeParams: next.selectedCreativeParams,
      customKeyValues: next.customKeyValues,
      customMacros: next.customMacros,
    });
    setEditing(null);
    setSnack(`Updated "${next.name}"`);
  };

  return (
    <Box>
      <SectionHeader
        title="Distributions"
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setAddOpen(true)}
            >
              + Add Distribution Tag
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleExport}
              disabled={state.distros.length === 0}
            >
              Export Distribution Tags
            </Button>
          </Stack>
        }
      />
      <DistroTable
        distros={state.distros}
        onCopy={handleCopy}
        onEdit={(d) => setEditing(d)}
        onDelete={handleDelete}
      />
      <AddDistroDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editorInitial && (
        <TagEditorDialog
          open={Boolean(editing)}
          mode="distro"
          title="Edit Distribution"
          initialState={editorInitial}
          submitLabel="Save"
          onClose={() => setEditing(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack(null)}
        message={snack ?? ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};
