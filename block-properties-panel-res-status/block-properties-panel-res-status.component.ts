import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { Subject, Subscription } from 'rxjs';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { ResultingCircuitService } from 'app/features/block-diagram/services/resulting-circuit.service';
import { Project } from 'app/core/models/project.model';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { takeUntil } from 'rxjs/operators';
import { BlockPropertiesResourceStatusService } from 'app/core/components/block-properties-components/block-properties-panel-res-status/block-properties-resource-status.service';
import { BlockPropertiesPanelResStatusModel } from 'app/core/components/properties-panel/models/block-properties-panel-res-status.model';
import { TranslateModule } from '@ngx-translate/core';
import { GButtonModule } from '@bosch/rbang';
import { select, Store } from '@ngrx/store';
import { AppStateInterface } from 'app/core/components/block-properties-components/resource-reference-id/models/app-state.model';
import {
  getChannelState,
  getIdState,
  getKernelState,
  getResRefState,
} from 'app/core/components/block-properties-components/resource-reference-id/store/selectors';
import {
  ResRefSectionState,
  ResRefState,
} from 'app/core/components/block-properties-components/resource-reference-id/models/resource-ref-state.model';
import { ResourceService } from 'app/features/block-diagram/services/resource.service';
import { resetSection } from 'app/core/components/block-properties-components/resource-reference-id/store/actions';
import { ConfigureResourceSection } from 'app/core/components/block-properties-components/enums/configure-resource-section.enum';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';
import {AssignmentUtils} from "../../../services/search/assignment.util";
import { NodeService } from 'app/core/services/node.service';

@Component({
  selector: 'app-block-properties-panel-res-status',
  templateUrl: './block-properties-panel-res-status.component.html',
  styleUrls: ['./block-properties-panel-res-status.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [GButtonModule, TranslateModule],
})
export class BlockPropertiesPanelResStatusComponent
  implements OnInit, OnDestroy
{
  @Input() project?: Project;
  @Input() resourceStatus: BlockPropertiesPanelResStatusModel = {
    idReferenceState: '',
    changeSent: false,
    channelReferenceState: '',
    kernelReferenceState: '',
    channelPriorityState: '',
    channelState: '',
    kernelPriorityState: '',
    kernelState: '',
    idPriorityState: '',
    anyMissingResource: false,
  };

  assignmentUtils = AssignmentUtils
  resource?: NodeModel;
  functionModule?: NodeModel;
  selectedBlock?: NodeModel;

  isCopySelected = false;
  isDTMSelected = false;
  isIRQSelected = false;

  notifier = new Subject<void>();
  kernelButton = '';
  idButton = '';
  channelButton = '';
  saveEnabled = false;
  resetEnabled = false;

  kernelState?: ResRefSectionState;
  channelState?: ResRefSectionState;

  constructor(
    private projectManagementService: ProjectManagementService,
    private blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService,
    private resultingCircuitService: ResultingCircuitService,
    public blockDiagramHighlightService: BlockDiagramHighlightService,
    public blockPropertiesResourceStatusService: BlockPropertiesResourceStatusService,
    private resourceService: ResourceService,
    private nodeService: NodeService,
    private store: Store<AppStateInterface>,
    private propertiesPanelService: PropertiesPanelService
  ) {}

  ngOnInit(): void {
    this.getSectionStates();
    this.getSaveButtonStatus();
    this.subscribeToResourceChange();
    this.subscribeToSelectedBlockChange();
    this.subscribeToFunctionModuleChange();
    this.checkIfResourceChanged();
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  private checkIfResourceChanged() {
    if (this.hasResourceModified()) {
      this.resetEnabled = true;
    }
  }

  private hasResourceModified(): boolean {
    if (!this.resource) return false;

    return (
      this.assignmentUtils.getValue(this.resource, 'kernel') !== this.assignmentUtils.getLibraryValue(this.resource, 'kernel') ||
      this.assignmentUtils.getValue(this.resource, 'channel') !== this.assignmentUtils.getLibraryValue(this.resource, 'channel') ||
      this.assignmentUtils.getValue(this.resource, 'resourceId') !== this.assignmentUtils.getLibraryValue(this.resource, 'resourceId')
    );
  }


  private getSaveButtonStatus() {
    this.store
      .pipe(select(getResRefState), takeUntil(this.notifier))
      .subscribe((value) => {
        this.saveEnabled = this.checkSaveEnabled(value);
        this.resetEnabled = this.checkResetEnabled(value);
      });
  }

  private checkResetEnabled(value: ResRefState): boolean {
    return !(
      value.idState.selectedCategory === '' &&
      value.kernelState.selectedCategory === '' &&
      value.channelState.selectedCategory === ''
    );
  }

  /**
   * Method to check if save button is either enabled or disabled by verifying first if the user has changed
   * at least something from one of the three sections: ID, KERNEL, CHANNEL. Then it checks if the values inserted
   * by the user inside each section is valid and can be saved. Then for each section if the user selected reference
   * for it, it checks if the resource dropdown has a valid value.
   * It also checks if the user selected value for the ID section and there are no resource classes that could be selected
   * @param value Store state which contains data regarding the state of all three sections: ID, KERNEL, STATE
   * such as dropdown options, dropdown selected value, checkbox status, type of selection inside a section
   * @private
   */
  private checkSaveEnabled(value: ResRefState): boolean {
    if (!this.checkResetEnabled(value)) {
      return false;
    }
    if (
      value.idState.selectedCategory === 'value' &&
      value.idState.noResourceClasses
    ) {
      return false;
    }
    if (
      !value.idState.isValueValid ||
      !value.kernelState.isValueValid ||
      !value.channelState.isValueValid
    ) {
      return false;
    }
    if (
      value.idState.selectedCategory === 'reference' &&
      !value.idState.dropdowns.resource.value
    ) {
      return false;
    }
    if (
      value.kernelState.selectedCategory === 'reference' &&
      !value.kernelState.dropdowns.resource.value
    ) {
      return false;
    }
    return (
      value.channelState.selectedCategory !== 'reference' ||
      !!value.channelState.dropdowns.resource.value
    );
  }

  private getSectionStates() {
    this.getIdSectionState();
    this.getKernelSectionState();
    this.getChannelSectionState();
  }

  private getChannelSectionState() {
    this.store
      .pipe(select(getChannelState), takeUntil(this.notifier))
      .subscribe((state) => {
        this.channelState = state;
        this.channelButton = state.selectedCategory;
      });
  }

  private getKernelSectionState() {
    this.store
      .pipe(select(getKernelState), takeUntil(this.notifier))
      .subscribe((state) => {
        this.kernelState = state;
        this.kernelButton = state.selectedCategory;
      });
  }

  private getIdSectionState() {
    this.store
      .pipe(select(getIdState), takeUntil(this.notifier))
      .subscribe((state) => {
        this.isCopySelected = state.checkboxes.isCopy;
        this.isDTMSelected = state.checkboxes.isDtm;
        this.isIRQSelected = state.checkboxes.isIrq;
        this.idButton = state.selectedCategory;
      });
  }

  private subscribeToSelectedBlockChange() {
    this.blockDiagramHighlightService.selected
      .pipe(takeUntil(this.notifier))
      .subscribe((selectedBlock) => (this.selectedBlock = selectedBlock));
  }

  modifyResource(resultingCircuits: NodeModel[]): NodeModel[] {
    this.updateCircuits(resultingCircuits);
    return resultingCircuits;
  }

  updateCircuits(resultingCircuits: NodeModel[]): void {
    this.resourceService
      .getResourcesWithSameId(resultingCircuits, this.resource?.id)
      .forEach((resource) => {
        this.updateResource(resource);
      });
  }

  modifyResourceWhenResetting(
    resultingCircuits: NodeModel[]
  ): NodeModel[] {
    this.updateCircuitsWhenResetting(resultingCircuits);
    return resultingCircuits;
  }

  updateCircuitsWhenResetting(resultingCircuits: NodeModel[]): void {
    this.resourceService
      .getResourcesWithSameId(resultingCircuits, this.resource?.id)
      .forEach((resource) => this.updateResourceWhenResetting(resource));
  }

  updateResourceWhenResetting(newResource: NodeModel): void {
    this.getNewResourceWithOriginalReq(newResource);
    this.resource = newResource;
  }

  // private getNewResourceWithOriginalReq(newResource: NodeModel) {
  //   if (!newResource?.originalRequirement || !this.resource) {
  //     return;
  //   }
  //   newResource.resourceId = newResource.originalRequirement.resourceId;
  //   newResource.channel = newResource.originalRequirement.channel;
  //   newResource.kernel = newResource.originalRequirement.kernel;
  //   newResource.key = `${newResource.resourceId}-${newResource.kernel}-${newResource.channel}`;
  // }

  // updateResource(resource: NodeModel): void {
  //   if (!this.resource) {
  //     return;
  //   }
  //   resource.originalRequirement = {
  //     ...this.resource.originalRequirement,
  //   } as NodeModel;

  //   if (this.isIRQSelected || this.isCopySelected || this.isDTMSelected) {
  //     this.setResourceValuesForCheckboxSelected(resource);
  //     return;
  //   }
  //   if (!this.kernelState || !this.channelState) {
  //     return;
  //   }
  //   resource.resourceId =
  //     this.blockPropertiesResourceStatusService.calculateStateForResource(
  //       this.resourceStatus.idReferenceState,
  //       this.resourceStatus.idPriorityState,
  //       '',
  //       this.idButton
  //     ) ?? this.resource.resourceId;
  //   resource.kernel =
  //     this.blockPropertiesResourceStatusService.calculateStateForResource(
  //       this.resourceStatus.kernelReferenceState,
  //       this.resourceStatus.kernelPriorityState,
  //       this.kernelState.selectedCategory,
  //       this.kernelButton
  //     ) ?? this.resource.kernel;
  //   resource.channel =
  //     this.blockPropertiesResourceStatusService.calculateStateForResource(
  //       this.resourceStatus.channelReferenceState,
  //       this.resourceStatus.channelPriorityState,
  //       this.channelState.selectedCategory,
  //       this.channelButton
  //     ) ?? this.resource.channel;
  //   resource.updateKey();
  //   resource.isChanged = true;
  //   this.resource = resource;
  // }
  private getNewResourceWithOriginalReq(newResource: NodeModel): void {
    if (!this.resource) return;

    const resourceId = this.assignmentUtils.getLibraryValue(newResource, 'resourceId');
    const kernel = this.assignmentUtils.getLibraryValue(newResource, 'kernel');
    const channel = this.assignmentUtils.getLibraryValue(newResource, 'channel');

    this.assignmentUtils.setOrUpdate(newResource, 'resourceId', resourceId);
    this.assignmentUtils.setOrUpdate(newResource, 'kernel', kernel);
    this.assignmentUtils.setOrUpdate(newResource, 'channel', channel);

    const key = `${resourceId}-${kernel}-${channel}`;
    this.assignmentUtils.setOrUpdate(newResource, 'key', key);    //rbName --- comment need to check with ashok bcz no more key in the attributes -----
  }

  updateResource(resource: NodeModel): void {
    if (!this.resource) return;

    if (this.isIRQSelected || this.isCopySelected || this.isDTMSelected) {
      this.setResourceValuesForCheckboxSelected(resource);
      return;
    }

    if (!this.kernelState || !this.channelState) return;

    this.assignmentUtils.setOrUpdate(
      resource,
      'resourceId',
      this.blockPropertiesResourceStatusService.calculateStateForResource(
        this.resourceStatus.idReferenceState,
        this.resourceStatus.idPriorityState,
        '',
        this.idButton
      ) ?? this.assignmentUtils.getValue(this.resource, 'resourceId')
    );

    this.assignmentUtils.setOrUpdate(
      resource,
      'kernel',
      this.blockPropertiesResourceStatusService.calculateStateForResource(
        this.resourceStatus.kernelReferenceState,
        this.resourceStatus.kernelPriorityState,
        this.kernelState.selectedCategory,
        this.kernelButton
      ) ?? this.assignmentUtils.getValue(this.resource, 'kernel')
    );

    this.assignmentUtils.setOrUpdate(
      resource,
      'channel',
      this.blockPropertiesResourceStatusService.calculateStateForResource(
        this.resourceStatus.channelReferenceState,
        this.resourceStatus.channelPriorityState,
        this.channelState.selectedCategory,
        this.channelButton
      ) ?? this.assignmentUtils.getValue(this.resource, 'channel')
    );

    this.assignmentUtils.setOrUpdate(resource, 'isChanged', true);

    this.resource = resource;
    // const project = this.projectManagementService.getProject();
    //  if (!project?.node?.length) return;
    //  this.nodeService.updateNodeInTree(project.node, this.resource);// update the node structure
    //  this.projectManagementService.updateProject(project);
  }

  setResourceValuesForCheckboxSelected(resource: NodeModel): void {
    // Set resourceId from status
    this.assignmentUtils.setOrUpdate(resource, 'resourceId', this.resourceStatus.idReferenceState);

    // Clear kernel and channel
    this.assignmentUtils.setOrUpdate(resource, 'kernel', '');
    this.assignmentUtils.setOrUpdate(resource, 'channel', '');

    // Mark resource as changed
    this.assignmentUtils.setOrUpdate(resource, 'isChanged', true);

    // Update the reference
    this.resource = resource;
  }

  private resetConfigureSection() {
    this.store.dispatch(resetSection({ section: ConfigureResourceSection.ID }));
    this.store.dispatch(
      resetSection({ section: ConfigureResourceSection.KERNEL })
    );
    this.store.dispatch(
      resetSection({ section: ConfigureResourceSection.CHANNEL })
    );
  }

  save(): void {
    this.propertiesPanelService.displayLoadingIndicator();
    if (!this.project) {
      return;
    }
    const circuits = this.resultingCircuitService.mapResultingCircuits(
      this.project
    );
   // this.project.node = this.modifyResource(circuits);

   const project = this.projectManagementService.getProject();
   if (!project?.node?.length || !this.resource ) return;
   const resource = this.getResourceFromProject(project.node,this.resource)

   if(resource)
   this.updateResource(resource);
   this.nodeService.updateNodeInTree(project.node, this.resource);
    this.projectManagementService.updateProject(project);
    this.blockPropertiesInterfaceContextService.changeResource(this.resource);
    this.blockPropertiesResourceStatusService.enableReset = true;
    this.resetConfigureSection();
  }
  getResourceFromProject(tree: NodeModel[], target: NodeModel): NodeModel | undefined {
    const targetId = target.id ?? target.directId;
    if (!targetId) return undefined;

    const stack: NodeModel[] = [...tree];  // start with all top-level nodes

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const currentId = current.id ?? current.directId;
      if (currentId === targetId) {
        return current;
      }

      if (current.children && current.children.length > 0) {
        stack.push(...current.children);
      }
    }

    return undefined;
  }


  resetFunction(object: NodeModel | undefined): void {
    if (!object || !this.project) {
      return;
    }
    this.resetConfigureSection();
    const resultingCircuits = this.resultingCircuitService.mapResultingCircuits(
      this.project
    );
    this.project.node =
      this.modifyResourceWhenResetting(resultingCircuits);
    this.projectManagementService.updateProject(this.project);
    if(!this.functionModule) return
    const functionModule = this.getResourceFromProject(this.project.node,this.functionModule)
    this.functionModule=functionModule
    this.blockPropertiesInterfaceContextService.changeResource(this.resource);
    this.blockPropertiesResourceStatusService.resetSection.next(true);
    this.blockPropertiesResourceStatusService.enableReset = false;
  }

  openInterfaceView(): void {
    if (!this.functionModule || !this.selectedBlock) {
      return;
    }
    this.blockDiagramHighlightService.openInterfaceView(
      this.selectedBlock,
      this.functionModule
    );
  }

  private subscribeToFunctionModuleChange() {
    this.blockPropertiesInterfaceContextService.functionModuleChange
      .pipe(takeUntil(this.notifier))
      .subscribe((functionModule) => {
        this.functionModule = functionModule;
      });
  }

  private subscribeToResourceChange(): Subscription {
    return this.blockPropertiesInterfaceContextService.resourceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((resource) => {
        this.resource = resource;
      });
  }
}
