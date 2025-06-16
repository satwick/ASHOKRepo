import { ResourceMicrocontroller } from 'app/core/models/microcontroller.model';

export class ResourceListEntry {
  resource: ResourceMicrocontroller;
  resourceStatus: ResourceStatus;
  resourceTooltip: string;

  constructor(
    resource: ResourceMicrocontroller,
    resourceStatus: ResourceStatus,
    resourceTooltip: string
  ) {
    this.resource = resource;
    this.resourceStatus = resourceStatus;
    this.resourceTooltip = resourceTooltip;
  }
}

export class ResourceStatus {
  statusMessage: string;
  statusDisplay: string;
  statusStyle: string;

  constructor(statusMessage: string, statusDisplay: string) {
    this.statusMessage = statusMessage;
    this.statusDisplay = statusDisplay;
    this.statusStyle = this.getStatusStyle();
  }

  private getStatusStyle() {
    switch (this.statusDisplay) {
      case ResourceStatusType.USED:
        return ResourceStatusStyle.WARNING;
      case ResourceStatusType.NOT_AVAILABLE:
      case ResourceStatusType.MUX_RESTRICTED:
        return ResourceStatusStyle.NOT_AVAILABLE;
      case ResourceStatusType.AVAILABLE:
        return ResourceStatusStyle.AVAILABLE;
      case ResourceStatusType.SELECTED:
      default:
        return ResourceStatusStyle.BASE;
    }
  }
}

export enum ResourceStatusStyle {
  AVAILABLE = 'available-text',
  WARNING = 'warning-text',
  NOT_AVAILABLE = 'not-available-text',
  BASE = '',
}

export enum ResourceStatusType {
  USED = 'Used',
  NOT_AVAILABLE = 'Not Available',
  AVAILABLE = 'Available',
  SELECTED = 'Selected',
  MUX_RESTRICTED = 'Mux Restricted',
}

export enum ResourceStatusMessage {
  AVAILABLE = 'PROPERTIES.BLOCK_DIAGRAM_PROPERTIES.RESOURCE_TOOLTIP.RESOURCE_AVAILABLE_MESSAGE',
  SELECTED = 'PROPERTIES.BLOCK_DIAGRAM_PROPERTIES.RESOURCE_TOOLTIP.RESOURCE_SELECTED_MESSAGE',
  ALREADY_USED = 'PROPERTIES.BLOCK_DIAGRAM_PROPERTIES.RESOURCE_TOOLTIP.RESOURCE_USED_MESSAGE',
  NOT_COMPATIBLE_WITH_PIN = 'PROPERTIES.BLOCK_DIAGRAM_PROPERTIES.RESOURCE_TOOLTIP.RESOURCE_NOT_IN_PIN_MESSAGE',
  MUX_RESTRICTED = 'PROPERTIES.BLOCK_DIAGRAM_PROPERTIES.RESOURCE_TOOLTIP.RESOURCE_MUX_RESTRICTED_MESSAGE',
}

export const resourceTypeMessageMap = new Map<
  ResourceStatusType,
  ResourceStatusMessage
>([
  [ResourceStatusType.AVAILABLE, ResourceStatusMessage.AVAILABLE],
  [ResourceStatusType.SELECTED, ResourceStatusMessage.SELECTED],
  [ResourceStatusType.USED, ResourceStatusMessage.ALREADY_USED],
  [
    ResourceStatusType.NOT_AVAILABLE,
    ResourceStatusMessage.NOT_COMPATIBLE_WITH_PIN,
  ],
  [ResourceStatusType.MUX_RESTRICTED, ResourceStatusMessage.MUX_RESTRICTED],
]);

export const resourceStatusOrder = [
  ResourceStatusType.SELECTED,
  ResourceStatusType.AVAILABLE,
  ResourceStatusType.USED,
  ResourceStatusType.MUX_RESTRICTED,
  ResourceStatusType.NOT_AVAILABLE,
];
