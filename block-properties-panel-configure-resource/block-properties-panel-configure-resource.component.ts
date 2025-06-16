import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { BlockPropertiesContext } from 'app/core/components/properties-panel/models/block-properties-context.model';
import { Observable, Subject } from 'rxjs';
import { ConfigureResourceContext } from 'app/core/components/properties-panel/models/configure-resource-context.model';
import { PropertiesIdResource } from 'app/core/components/block-properties-components/block-properties-panel-id/block-properties-panel-id.component';
import { takeUntil } from 'rxjs/operators';
import { BlockDiagramTableService } from 'app/features/block-diagram/services/block-diagram-table.service';
import { emptyResourceStatus } from 'app/core/components/properties-panel/models/block-properties-panel-res-status.model';
import { HeightChangeService } from 'app/core/services/height-change/height-change.service';
import { BlockPropertiesPanelResStatusComponent } from '../block-properties-panel-res-status/block-properties-panel-res-status.component';
import { BlockPropertiesPanelResourceListComponent } from '../block-properties-panel-resource-list/block-properties-panel-resource-list.component';
import { BlockPropertiesPanelChannelComponent } from '../block-properties-panel-channel/block-properties-panel-channel.component';
import { BlockPropertiesPanelKernelComponent } from '../block-properties-panel-kernel/block-properties-panel-kernel.component';
import { BlockPropertiesPanelIdComponent } from '../block-properties-panel-id/block-properties-panel-id.component';
import { CommonModule } from '@angular/common';
import { select, Store } from '@ngrx/store';
import { AppStateInterface } from 'app/core/components/block-properties-components/resource-reference-id/models/app-state.model';
import {
  copyChanged,
  resetState,
} from 'app/core/components/block-properties-components/resource-reference-id/store/actions';
import {
  PropertiesChannel,
  PropertiesKernel,
} from 'app/core/components/block-properties-components/models/section-properties.model';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { Project } from 'app/core/models/project.model';
import {
  checkboxes,
  getIdState,
} from 'app/core/components/block-properties-components/resource-reference-id/store/selectors';
import { ResRefSectionState } from 'app/core/components/block-properties-components/resource-reference-id/models/resource-ref-state.model';

@Component({
  selector: 'app-block-properties-panel-configure-resource',
  templateUrl: './block-properties-panel-configure-resource.component.html',
  styleUrls: ['./block-properties-panel-configure-resource.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    BlockPropertiesPanelIdComponent,
    BlockPropertiesPanelKernelComponent,
    BlockPropertiesPanelChannelComponent,
    BlockPropertiesPanelResourceListComponent,
    BlockPropertiesPanelResStatusComponent,
  ],
})
export class BlockPropertiesPanelConfigureResourceComponent
  implements OnInit, OnDestroy
{
  @ViewChild('container', { static: true }) container?: ElementRef;
  private notifier = new Subject<void>();
  context?: ConfigureResourceContext;
  activeIndex = 0;
  idState = new Observable<ResRefSectionState>();
  resourceState = emptyResourceStatus;
  height = 0;
  minHeight = this.propertiesPanelService.minHeightGeneral;
  project?: Project;
  projectMode = '';

  constructor(
    private panelService: PropertiesPanelService,
    private detectionChange: ChangeDetectorRef,
    private blockDiagramTableService: BlockDiagramTableService,
    private heightChangeService: HeightChangeService,
    private propertiesPanelService: PropertiesPanelService,
    private store: Store<AppStateInterface>,
    private projectService: ProjectManagementService
  ) {
    this.store.dispatch(resetState());
  }

  ngOnInit(): void {
    this.subscribeToContext();
    this.subscribeToHeightChange();
    this.subscribeToProject();
    this.idState = this.store.pipe(select(getIdState));
    this.blockDiagramTableService.initializeOriginalRequirement();
  }

  ngOnDestroy(): void {
    this.propertiesPanelService.pushNewProperties('EMPTY');
    this.notifier.next();
    this.notifier.complete();
  }

  private subscribeToProject() {
    this.projectService
      .getProjectNotifier()
      .pipe(takeUntil(this.notifier))
      .subscribe((project) => {
        this.project = project;
        this.projectMode = this.project.projectVersion?.status ?? '';
      });
  }

  subscribeToContext() {
    return this.panelService.context$
      .pipe(takeUntil(this.notifier))
      .subscribe((context) => {
        this.context = context as BlockPropertiesContext;
      });
  }

  stateOfIdResourceChange(eventIdResource: PropertiesIdResource): void {
    this.resourceState.idPriorityState = eventIdResource.getUser;
    this.resourceState.idReferenceState = eventIdResource.idReferenceInput;
  }

  stateOfKernelChange(eventKernel: PropertiesKernel): void {
    this.resourceState.kernelPriorityState = eventKernel.getUser;
    this.resourceState.kernelReferenceState = eventKernel.kernelReferenceInput;
  }

  stateOfChannelChange(eventChannel: PropertiesChannel): void {
    this.resourceState.channelPriorityState = eventChannel.getUser;
    this.resourceState.channelReferenceState =
      eventChannel.channelReferenceInput;
  }

  receiveKernelState(eventKernelState: string): void {
    this.resourceState.kernelState = eventKernelState;
  }

  receiveChannelState(eventChannelState: string): void {
    this.resourceState.channelState = eventChannelState;
  }

  private subscribeToHeightChange() {
    this.heightChangeService.height
      .pipe(takeUntil(this.notifier))
      .subscribe((value) => {
        this.height =
          this.heightChangeService.configPanelHeight +
          this.heightChangeService.propertiesPanelLocationOnYAxis -
          value;
        this.detectionChange.detectChanges();
      });
  }

  protected readonly copyChanged = copyChanged;
  protected readonly checkboxes = checkboxes;
}
