import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,

} from '@angular/core';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Subject } from 'rxjs';
import { BlockDiagramTableService } from 'app/features/block-diagram/services/block-diagram-table.service';
import { BlockPropertiesPanelConfigureResourceComponent } from 'app/core/components/block-properties-components/block-properties-panel-configure-resource/block-properties-panel-configure-resource.component';
import { takeUntil } from 'rxjs/operators';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { TranslateModule } from '@ngx-translate/core';
import { GButtonModule } from '@bosch/rbang';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule, NgIf } from '@angular/common';
import { isFrozenOrAssigned } from 'app/core/models/project.model';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';
import { AssignmentUtils } from 'app/core/services/search/assignment.util';
import { FormsModule } from '@angular/forms';
import { AssignmentModel } from 'app/core/models/dynamic-attributes/assignment.model';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { NodeService } from 'app/core/services/node.service';

export enum ResourceAttrKeys {
  RESOURCEID = 'resourceId',
  KERNEL = 'kernel',
  CHANNEL = 'channel',
}

@Component({
  selector: 'app-block-properties-uc-resource-attributes',
  templateUrl: './block-properties-uc-resource-attributes.component.html',
  styleUrls: ['./block-properties-uc-resource-attributes.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgIf, TooltipModule, GButtonModule, TranslateModule,CommonModule,FormsModule],
})
export class BlockPropertiesUcResourceAttributesComponent
  implements OnInit, OnDestroy
{
  resource?: NodeModel;
  notifier = new Subject<void>();
  selectedBlock?: NodeModel;
  @Input()
  interfaceVariant: NodeModel | undefined;
  @Input()
  resourceClassOptions: { key: string; values: string[] }[] = [];
  // @Input()
  // canAddNew: boolean | undefined;
  // @Output()
  // canAddNewChange = new EventEmitter<boolean>();
  message?: string;
  isButtonEnabled = false;
  assignmentUtils = AssignmentUtils;
  tempValueMap: { [assignmentId: string]: string } = {};

  constructor(
    private blockPropertiesInterfaceContext: BlockPropertiesInterfaceContextService,
    public blockDiagramTableService: BlockDiagramTableService,
    private blockDiagramHighlightService: BlockDiagramHighlightService,
    private projectManagementService: ProjectManagementService,
    private propertiesPanelService: PropertiesPanelService,
    private nodeService: NodeService,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscribeToResourceChange();
    this.subscribeToSelectedBlockChange();
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }


// onResourceClassChange(assignment: AssignmentModel,selectedKey: string) {
//   // When resourceClass changes, update the id automatically
//   this.tempValueMap['id'] = selectedKey;
//   (assignment as any).tempValue = selectedKey;
// }
onResourceClassChange(assignment: AssignmentModel, selectedKey: string): void {
  this.tempValueMap['subclass'] = selectedKey;
  (assignment as any).tempValue = selectedKey;

  // Reset the resourceId when subclass changes
  this.tempValueMap['resourceId'] = '';
  const resIdAssignment = this.resource?.assignments?.find(a => a.attribute?.directName === 'resourceId');
  if (resIdAssignment) {
    (resIdAssignment as any).tempValue = '';
  }
}

getResourceIdsForSelectedSubclass(): string[] {
  const subclass = this.tempValueMap['subclass'];
  const selected = this.resourceClassOptions.find(opt => opt.key === subclass);
  return selected?.values || [];
}

// onResourceClassChange(subclassAssignment: AssignmentModel, selectedOption: any) {
//   // Update subclass assignment
//   (subclassAssignment as any).tempValue = selectedOption.value;
//   this.tempValueMap['subclass'] = selectedOption.value;

//   // Find the resourceId assignment from your list (assuming you have access to it)
//   const resourceIdAssignment = this.resource?.assignments.find(a => a.attribute.directName === 'resourceId');

//   if (resourceIdAssignment) {
//     (resourceIdAssignment as any).tempValue = selectedOption.key;
//     this.tempValueMap['id'] = selectedOption.value;
//   }
// }


  checkForAttribute(designObjectAttribute: any): string {
    return this.blockPropertiesInterfaceContext.checkForAttribute(
      designObjectAttribute
    );
  }
  onTempValueChanged(assignment: AssignmentModel, value: string): void {
    (assignment as any).tempValue = value;
  }

  private subscribeToSelectedBlockChange() {
    this.blockDiagramHighlightService.selected
      .pipe(takeUntil(this.notifier))
      .subscribe((selectedBlock) => (this.selectedBlock = selectedBlock));
  }

  configureResource(resourceRequirement: NodeModel): void {
    this.blockDiagramTableService.maximizeComponent(
      BlockPropertiesPanelConfigureResourceComponent
    );
    this.blockDiagramTableService.configureResource(resourceRequirement);
  }
  get isAddMode(): boolean {
    return !!(this.resource && (this.resource as any).isAdd === true);
  }
  checkButtonEnabled(): void {
    if (!this.interfaceVariant) {
      this.isButtonEnabled = false;
    } else {
      this.isButtonEnabled =
        this.isResourceValidForConfiguration() &&
        (this.assignmentUtils.getValue(this.interfaceVariant, 'isSelected') ==='true') &&
        !isFrozenOrAssigned(
          this.projectManagementService.getProjectReadOnly().projectVersion
            ?.status
        );
    }
  }

  checkForOriginalRequirement(
    resource: NodeModel,
    originalRequirementAttribute: string
  ): string {
    if (!resource.assignments) {
      return this.checkForAttribute(
        resource[originalRequirementAttribute as keyof NodeModel]
      );
    }
    return this.checkForAttribute(
      resource[
        originalRequirementAttribute as keyof NodeModel
      ]
    );
  }

  checkForAssignedAttribute(
    resourceRequirement: NodeModel,
    assignedResourceAttribute: any,
    variant?: NodeModel
  ): string {
    if (!variant || !variant.assignments) {
      return '-';
    }
    const assignedResource = (variant.children ?? [])
      .flatMap(child => child.nodeType?.name === 'resourceRequirementGroup' ? (child.children ?? []) : [child])
      .find((resource) =>
        resource.name === resourceRequirement.name &&
        this.assignmentUtils.getValue(resource,'ordinalNumber') === this.assignmentUtils.getValue(resourceRequirement,'ordinalNumber'));
    if (!assignedResource) {
      return '-';
    }

    return this.checkForAttribute(
      assignedResource[assignedResourceAttribute as keyof NodeModel]
    );
  }

  private subscribeToResourceChange(): void {
    this.blockPropertiesInterfaceContext.resourceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((resource) => {
        this.resource = resource;
        /*this.initResourceReqMaps();*/
        this.message = undefined;
        this.checkButtonEnabled();
      });
  }

  private isResourceValidForConfiguration(): boolean {
    if (!this.resource) {
      return false;
    }
    return this.calculateInfoMessage() === undefined;
  }

  private calculateInfoMessage(): string | undefined {
    if (!this.resource) {
      return undefined;
    }
    const subclass = this.resource.name.toLowerCase();
    const resId = String(this.assignmentUtils.getValue(this.resource,'resourceId')).toLowerCase();
    if (subclass === 'spi' && resId === 'slso') {
      this.message = 'DISABLED_SPI_INFO';
    }
    if (subclass === 'us_bus' && resId === 'en') {
      this.message = 'DISABLED_MSC_INFO';
    }
    return this.message;
  }
  saveAssignments(node: NodeModel): void {
    node.assignments?.forEach(a => {
      if ((a as any).tempValue !== undefined) {
        a.value = (a as any).tempValue;
        delete (a as any).tempValue;
      }
      delete (a as any).isAdd;
    });

    if ((node as any).isAdd) {
      //node.id = -1;
      delete (node as any).isAdd;
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this.saveAssignments(child);
      }
    }
  }
  /*private initResourceReqMaps() {
    this.clearResourceReqMaps();
    Object.values(ResourceAttrKeys).forEach((key) =>
      this.setAttributesByKey(key)
    );
  }*/

  /*private setAttributesByKey(key: string) {
    if (!this.resource || !this.interfaceVariant) {
      return;
    }
    this.originalResRequirement.set(
      key,
      this.checkForOriginalRequirement(this.resource, key)
    );
    this.userSetResRequirement.set(
      key,
      this.checkForAttribute(this.resource[key as keyof NodeModel])
    );
    this.assignedResRequirement.set(
      key,
      this.checkForAssignedAttribute(this.resource, key, this.interfaceVariant)
    );
  }

  private clearResourceReqMaps() {
    this.originalResRequirement.clear();
    this.userSetResRequirement.clear();
    this.assignedResRequirement.clear();
  }*/
    // onResourceClassChanged(selectedValue: string): void {
    //   const idAssignment = this.resource?.assignments?.find(a => a.attribute?.directName === 'resourceId');
    //   if (idAssignment) {
    //     (idAssignment as any).tempValue = selectedValue; // or map from a dictionary if needed
    //   }
    // }

  updateNewResource(value: boolean) {
    //  this.canAddNew = true;
    if(this.resource){
    this.propertiesPanelService.displayLoadingIndicator();
    this.saveAssignments(this.resource); // apply tempValue to value
    const project = this.projectManagementService.getProject();
    if (!project?.node?.length) return;
    this.nodeService.updateNodeInTree(project.node, this.resource);// update the node structure
    this.projectManagementService.updateProject(project);
    this.cdRef.detectChanges()
      //this.canAddNewChange.emit(value);
      this.tempValueMap = {};
    }
    }
  protected readonly isFrozen = isFrozenOrAssigned;
  protected readonly String = String;
}
