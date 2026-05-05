import { Box, Button, Snackbar, Stack } from "@mui/material";
import { useState } from "react";
import { useApp } from "../state/AppContext";
import type { Distro } from "../types";
import { buildDistroUrl } from "../lib/tagBuilder";
import { downloadCsv } from "../lib/csvExport";
import { DistroTable } from "./DistroTable";
import { TagEditorDialog } from "./TagEditorDialog";
import { ManageTemplatesDialog } from "./ManageTemplatesDialog";
import { SectionHeader } from "./SectionHeader";

export const DistrosSection = () => {
  const { state, removeDistro } = useApp();
  const isAdmin = state.role === "admin";
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Distro | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const handleCopy = async (distro: Distro) => {
    await navigator.clipboard.writeText(
      buildDistroUrl(distro, state.paramsCatalog),
    );
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
    downloadCsv(state.distros, state.paramsCatalog);
    setSnack(`Exported ${state.distros.length} distribution(s) to CSV`);
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
            {isAdmin && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setManageOpen(true)}
              >
                Manage Templates
              </Button>
            )}
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
      <TagEditorDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(message) => setSnack(message)}
      />
      <TagEditorDialog
        open={Boolean(editing)}
        editingDistro={editing}
        onClose={() => setEditing(null)}
        onSaved={(message) => setSnack(message)}
      />
      <ManageTemplatesDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onSaved={(message) => setSnack(message)}
      />
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
