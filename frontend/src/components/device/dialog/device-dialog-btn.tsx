import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid2,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { useDeviceUserMetadataMutation } from "../../../data/query/use-device-user-metadata-mutation";
import { useDevicesFullQuery } from "../../../data/query/use-devices-full-query";
import { useRemoveDeviceMutation } from "../../../data/query/use-remove-device-mutation";
import { AgentMetadata } from "../../../data/types/get-devices";
import {
  DeviceUserMeta,
  DeviceUserMetaTheme,
  DeviceUserMetaType,
} from "../../../data/types/get-devices-user-meta";
import { DeviceContext } from "../provider/device-provider";
import { useAgentHealth } from "./use-agent-health";

interface FormElement extends HTMLFormElement {
  readonly elements: HTMLFormControlsCollection &
    Record<keyof DeviceUserMeta, HTMLInputElement>;
}

export const DeviceDialogBtn: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  const { device, deviceUserMeta } = DeviceContext.useValue();

  const devicesFullQuery = useDevicesFullQuery();
  const updateUserMetadataMutation = useDeviceUserMetadataMutation();
  const removeDeviceMutation = useRemoveDeviceMutation();

  const agentHealth = useAgentHealth();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const onSubmit: React.FormEventHandler<FormElement> = async (event) => {
    event.preventDefault();

    const elements = event.currentTarget.elements;

    await updateUserMetadataMutation.mutateAsync({
      deviceId: deviceUserMeta.deviceId,
      name: elements.name.value,
      type: (elements.type.value as typeof deviceUserMeta.type) || undefined,
      theme: (elements.theme.value as typeof deviceUserMeta.theme) || undefined,
    });

    setOpen(false);
  };

  const agentMetadataList =
    devicesFullQuery.data?.agentMetadataList.filter(
      (metadata) => metadata.deviceId === device.id
    ) ?? [];

  const instanceList =
    devicesFullQuery.data?.instanceList.filter(
      (instance) => instance.parentId === device.id
    ) ?? [];

  const appList =
    devicesFullQuery.data?.appList.filter(
      (app) =>
        app.parentId === device.id ||
        instanceList.some((instance) => instance.id === app.parentId)
    ) ?? [];

  const lastAgentMetadata = agentMetadataList[0] as AgentMetadata | undefined;

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        color="secondary"
        title={agentHealth.description}
      >
        <Badge
          color={
            agentHealth.state === "error"
              ? "error"
              : agentHealth.state === "warning"
              ? "warning"
              : "success"
          }
          variant="dot"
        >
          <SettingsIcon fontSize="inherit" />
        </Badge>
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={onSubmit}>
          <DialogTitle>
            {/* {deviceUserMeta.name ?? device.id} */}

            <TextField
              name="name"
              defaultValue={deviceUserMeta.name}
              label={`Name for ${device.id}`}
              size="small"
              fullWidth
            />
          </DialogTitle>
          <DialogContent>
            <Grid2 container spacing={2}>
              {/* <Grid2 size={12}>
                <Typography variant="subtitle1">Device metadata</Typography>
              </Grid2> */}
              {/* <Grid2 size={12}>
                <TextField
                  name="name"
                  defaultValue={deviceUserMeta.name}
                  label="Name"
                  size="small"
                  fullWidth
                />
              </Grid2> */}

              <Grid2 size={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    defaultValue={deviceUserMeta.type ?? ""}
                    label="Type"
                  >
                    {(
                      [
                        "server",
                        "router",
                        "mediacenter",
                        "desktop",
                        "cloud",
                      ] satisfies DeviceUserMetaType[]
                    ).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              <Grid2 size={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Theme</InputLabel>
                  <Select
                    name="theme"
                    defaultValue={deviceUserMeta.theme}
                    label="Theme"
                  >
                    {(
                      [
                        "default",
                        "blue",
                        "green",
                        "mauve",
                        "yellow",
                      ] satisfies DeviceUserMetaTheme[]
                    ).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>

              <Grid2 size={12}>
                <Button
                  type="submit"
                  variant="outlined"
                  loading={updateUserMetadataMutation.isPending}
                  size="small"
                  fullWidth
                >
                  Update
                </Button>
              </Grid2>

              <Grid2 size={12}>
                <Divider variant="middle" />
              </Grid2>

              <Grid2 size={12}>
                {agentHealth.state === "error" && (
                  <Alert severity="error" variant="outlined">
                    {agentHealth.description}
                  </Alert>
                )}
                {agentHealth.state === "warning" && (
                  <Alert severity="warning" variant="outlined">
                    {agentHealth.description}
                  </Alert>
                )}
              </Grid2>

              {lastAgentMetadata && (
                <>
                  <Grid2 size={6}>
                    Last update:{" "}
                    {new Date(lastAgentMetadata.time).toLocaleString()}
                  </Grid2>
                  <Grid2 size={6}>
                    Release tag: {lastAgentMetadata.releaseTag}
                  </Grid2>
                  <Grid2 size={6}>
                    Duration:{" "}
                    {lastAgentMetadata.computeDuration.toLocaleString()}
                    ms
                  </Grid2>
                </>
              )}

              <Grid2 size={12}>
                <Accordion disabled={agentMetadataList.length === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Agent metadata raw list ({agentMetadataList.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    style={{
                      overflow: "auto",
                      maxHeight: 600,
                    }}
                  >
                    <Typography component="pre" margin={0}>
                      {JSON.stringify(agentMetadataList, undefined, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Device raw data</Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    style={{
                      overflow: "auto",
                      maxHeight: 600,
                    }}
                  >
                    <Typography component="pre" margin={0}>
                      {JSON.stringify(device, undefined, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                <Accordion disabled={instanceList.length === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      Instance raw list ({instanceList.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    style={{
                      overflow: "auto",
                      maxHeight: 600,
                    }}
                  >
                    <Typography component="pre" margin={0}>
                      {JSON.stringify(instanceList, undefined, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                <Accordion disabled={appList.length === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>App raw list ({appList.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    style={{
                      overflow: "auto",
                      maxHeight: 600,
                    }}
                  >
                    <Typography component="pre" margin={0}>
                      {JSON.stringify(appList, undefined, 2)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Grid2>

              <Grid2 size={12}>
                {confirmRemove ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={async () => {
                      await removeDeviceMutation.mutateAsync({
                        deviceId: device.id,
                      });
                      handleClose();
                    }}
                    loading={removeDeviceMutation.isPending}
                    size="small"
                    fullWidth
                  >
                    Really ?
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmRemove(true)}
                    size="small"
                    fullWidth
                  >
                    Remove
                  </Button>
                )}
              </Grid2>
            </Grid2>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
};
