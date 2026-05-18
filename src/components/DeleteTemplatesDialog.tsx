import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useApp } from "../state/AppContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const DeleteTemplatesDialog = ({ open, onClose, onSaved }: Props) => {
  const { state, deleteTemplates, setTemplateDisabled } = useApp();

  const handleToggleEnabled = (id: string, currentlyDisabled: boolean) => {
    const template = state.templates.find((t) => t.id === id);
    if (!template) return;
    // Checkbox checked = enabled, unchecked = disabled. So this is a flip.
    const nextDisabled = !currentlyDisabled;
    setTemplateDisabled(id, nextDisabled);
    onSaved?.(
      `${nextDisabled ? "Disabled" : "Enabled"} template "${template.name}"`,
    );
  };

  const handleDeleteOne = (id: string, name: string) => {
    if (
      window.confirm(
        `Delete template "${name}"? This removes it entirely. Existing distros that used this template are unaffected — they're self-contained snapshots. This cannot be undone.`,
      )
    ) {
      deleteTemplates([id]);
      onSaved?.(`Deleted "${name}"`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { backgroundColor: "background.paper", borderRadius: 1 },
      }}
    >
      <DialogTitle sx={{ pr: 6, py: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
          Delete / Disable Templates
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
        {state.templates.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            No templates available.
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Checkbox</strong> toggles enabled / disabled. A disabled
              template stays hidden from the regular Add Distribution Tag
              dropdown but remains visible (greyed out) here so it can be
              re-enabled. The <strong>trash</strong> icon deletes a template
              entirely — existing distros that used it are unaffected.
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                maxHeight: 360,
                overflowY: "auto",
              }}
            >
              <List dense disablePadding>
                {state.templates.map((t) => {
                  const isDisabled = Boolean(t.disabled);
                  return (
                    <ListItem
                      key={t.id}
                      disablePadding
                      sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        "&:last-of-type": { borderBottom: 0 },
                        py: 0.5,
                        opacity: isDisabled ? 0.55 : 1,
                      }}
                      secondaryAction={
                        <Tooltip title="Delete template entirely">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDeleteOne(t.id, t.name)}
                            sx={{ color: "text.secondary", mr: 0.5 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 44, pl: 1 }}>
                        <Tooltip
                          title={
                            isDisabled
                              ? "Disabled — check to re-enable"
                              : "Enabled — uncheck to disable"
                          }
                        >
                          <Checkbox
                            edge="start"
                            checked={!isDisabled}
                            onChange={() =>
                              handleToggleEnabled(t.id, isDisabled)
                            }
                            size="small"
                          />
                        </Tooltip>
                      </ListItemIcon>
                      <ListItemText
                        primary={t.name}
                        secondary={
                          <>
                            {t.family.toUpperCase()}
                            {t.advertiserId ? ` · ${t.advertiserId}` : ""}
                            {isDisabled ? " · disabled" : ""}
                          </>
                        }
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{
                          variant: "caption",
                          sx: { letterSpacing: "0.04em" },
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: "primary.main" }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
