import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Subject } from 'rxjs';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { TooltipShowPipe } from '../../../pipes/tooltip-show.pipe';
import { TruncatePipe } from 'app/core/pipes/truncate.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { BlockPropertiesInterfaceVariantAttributesComponent } from '../block-properties-interface-variant-attributes/block-properties-interface-variant-attributes.component';
import { GButtonModule, GCheckboxModule } from '@bosch/rbang';
import { TooltipModule } from 'primeng/tooltip';
import { ScrollIntoViewDirective } from '../../../directives/scroll-into-view.directive';
import { NgClass, NgStyle } from '@angular/common';
import { DisplayDesignObjectMenuService } from 'app/features/design-object-menu/design-object-menu/display-design-object-menu.service';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';
import { AssignmentUtils } from '../../../services/search/assignment.util';
import { NodeService } from 'app/core/services/node.service';
import { FormsModule } from '@angular/forms';
import { Project } from 'app/core/models/project.model';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { AssignmentModel } from 'app/core/models/dynamic-attributes/assignment.model';
import { takeUntil } from 'rxjs/operators';
import { NodeEditService } from 'app/features/block-diagram/services/node-edit.service';

@Component({
  selector: 'app-block-properties-interface-panel',
  templateUrl: './block-properties-interface-panel.component.html',
  styleUrls: ['./block-properties-interface-panel.component.scss'],
  standalone: true,
  imports: [
    ScrollIntoViewDirective,
    NgClass,
    TooltipModule,
    GCheckboxModule,
    BlockPropertiesInterfaceVariantAttributesComponent,
    TranslateModule,
    TruncatePipe,
    TooltipShowPipe,
    NgStyle,
    GButtonModule,
    FormsModule
  ],
  encapsulation: ViewEncapsulation.None,
})
export class BlockPropertiesInterfacePanelComponent implements OnInit, OnDestroy {
  functionModule?: NodeModel;
  textSize = 12;
  selectedVariant?: NodeModel;
  selectedInterface?: NodeModel;
  characterThreshold = 2;
  isSidePanelOpen = false;
  assignmentUtils = AssignmentUtils;
  private notifier: Subject<void> = new Subject();
 // isModified = false;

  constructor(
    private blockPropertiesInterfaceContext: BlockPropertiesInterfaceContextService,
    private blockDiagramHighlightService: BlockDiagramHighlightService,
    private displayDesignObjectMenuService: DisplayDesignObjectMenuService,
    private nodeService: NodeService,
    private projectManagementService: ProjectManagementService,
    private cdRef: ChangeDetectorRef,
    private nodeEditService: NodeEditService
  ) {}

  ngOnInit(): void {
    this.subscribeToDesignObjectMenu();
    this.subscribeToVariantChange();
    this.subscribeToInterfaceChange();
    this.subscribeToFunctionModuleChange();

    //this.nodeEditService.registerCommitFunction(() => this.saveNodeAssignments());
    //this.nodeEditService.registerResetFunction(() => this.resetInterfaceChanges());
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  private subscribeToDesignObjectMenu() {
    this.displayDesignObjectMenuService.isActive
      .pipe(takeUntil(this.notifier))
      .subscribe((value) => {
        this.isSidePanelOpen = value;
      });
  }

  getAttributeBindingValue(assignment: AssignmentModel): string {
    const temp = (assignment as any).tempValue;
    if (temp !== undefined && temp !== null) {
      return temp;
    }
    return assignment.value != null ? assignment.value : assignment.libraryValue ?? '';
  }

  setAttributeBindingValue(assignment: AssignmentModel, val: string): void {
    (assignment as any).tempValue = val;
  }

  resetAttributeValue(node: NodeModel, assignment: AssignmentModel): void {
    (assignment as any).tempValue = assignment.libraryValue ?? '';
  }

  getIsUsedCheckboxState(node: NodeModel): boolean {
    const assignment = node.assignments?.find(a => a.attribute?.directName === 'isUsed');
    const tempValue = (assignment as any)?.tempValue ?? assignment?.value ?? assignment?.libraryValue;
    return tempValue === 'true';
  }



  selectInterface(interfaceToUc: NodeModel): void {
    this.selectedInterface = interfaceToUc;
    this.blockPropertiesInterfaceContext.changeInterface(interfaceToUc);
    this.blockPropertiesInterfaceContext.changeVariant();
    this.blockDiagramHighlightService.selected?.next(interfaceToUc);
    this.blockDiagramHighlightService.highlighted.next(interfaceToUc);
    this.blockDiagramHighlightService.selection.next(interfaceToUc.name);
  }
  getAttributeValue(object: any, attrName: string): any {
    return object?.assignments?.find(
      (assignment: any) => assignment?.attribute?.directName === attrName
    )?.value;
  }

  getAssignment(node: NodeModel, directName: string) {
    return node.assignments?.find(a => a.attribute?.directName === directName);
  }
  onAssignmentChange(node: NodeModel, directName: string, event: any): void {
    const assignment = this.getAssignment(node, directName);
    if (assignment) {
      assignment.value = event.checked.toString();

      if (this.selectedInterface?.id === node.id) {
        // Trigger Angular to detect changes in subcomponents
        this.cdRef.detectChanges();
      }
    }
  }
  onInterfaceCheckboxClicked(interfaceToUc: NodeModel, event: Event): void {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    const newValue = checked ? 'true' : 'false';

    const assignment = interfaceToUc.assignments?.find(
      (a) => a.attribute?.directName === 'isUsed'
    );

    if (assignment && assignment.value !== newValue) {
      assignment.value = newValue;
      this.onAttributeChanged(interfaceToUc, 'isUsed', newValue);

      //Force Angular to reflect this in attribute panel
      this.selectedInterface = Object.assign(
        Object.create(Object.getPrototypeOf(interfaceToUc)),
        interfaceToUc
      );
    }
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project);
    this.projectManagementService.updateProject(project);
  }

  private subscribeToVariantChange() {
    this.blockPropertiesInterfaceContext.variantChange
      .pipe(takeUntil(this.notifier))
      .subscribe((interfaceVariant) => {
        this.selectedVariant = interfaceVariant;
      });
  }

  private subscribeToInterfaceChange() {
    this.blockPropertiesInterfaceContext.interfaceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((interfaceToMicrocontroller) => {
        this.selectedInterface = interfaceToMicrocontroller;
      });
  }
  getNodeFromProject(tree: NodeModel[], target: NodeModel): NodeModel | undefined {
    if (!target) return;

    const targetId = target.id ?? target.directId;
    const isInterface2McTarget = target.nodeType?.name === 'interface2Microcontroller';

    if (!targetId) return undefined;

    const stack: NodeModel[] = [...tree];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const currentId = current.id ?? current.directId;

      if (currentId === targetId) {
        // 🔍 Optional log
        console.log('✅ Found node:', current);
        return current;
      }

      const currentType = current.nodeType?.name;
      const isConnectionNet = currentType === 'connectionNet';

      // ⛔ Skip children of connectionNet ONLY for interface2Microcontroller
      if (
        isConnectionNet &&
        isInterface2McTarget
      ) {
        continue; // skip entire subtree under connectionNet
      }

      if (current.children?.length) {
        stack.push(...current.children);
      }
    }

    return undefined;
  }

  private subscribeToFunctionModuleChange() {
    this.blockPropertiesInterfaceContext.functionModuleChange
      .pipe(takeUntil(this.notifier))
      .subscribe((functionModule) => {
        this.functionModule = functionModule;
       // const project = this.projectManagementService.getProject();
        //this.functionModule = this.getNodeFromProject(project.node ?? [], functionModule);
      });
  }
  resetNodeChanges(node: NodeModel): void {
    this.nodeService.resetParentNode(node);
    this.saveNodeAssignments(node);
  }

  hasModifiedAssignments(interfaceToUc: NodeModel): boolean {
    return this.nodeService.hasModifiedAssignments(interfaceToUc);
  }

  isInterfaceTreeModified(node: NodeModel): boolean {
    if (this.isNodeModified(node)) return true;
    return node.children?.some(child => this.isInterfaceTreeModified(child)) ?? false;
  }

  private isNodeModified(node: NodeModel): boolean {
    return node.assignments?.some(a => {
      const temp = (a as any).tempValue ?? a.value;
      return temp !== a.value;
    }) ?? false;
  }

  get isInterfaceDirty(): boolean {
    return this.selectedInterface ? this.nodeService.isInterfaceTreeModified(this.selectedInterface) : false;
  }

  resetInterfaceChanges(): void {
    if (this.selectedInterface) {
      this.nodeService.resetParentAndChildNodes(this.selectedInterface);
    }
    if (this.selectedVariant) {
      this.nodeService.resetParentAndChildNodes(this.selectedVariant);
    }
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project);
    this.projectManagementService.updateProject(project);
    this.cdRef.detectChanges();
  }

  resetSingleInterface(interfaceNode: NodeModel): void {
    this.nodeService.resetParentAndChildNodes(interfaceNode);
  }

  saveAssignments(node : NodeModel): void {
    node.assignments?.forEach(a => {
      if ((a as any).tempValue !== undefined) {
        a.value = (a as any).tempValue;
        delete (a as any).tempValue;
      }
      delete (a as any).isAdd;
    });

    // Step 2: Reset temp ID for temporary nodes
    if ((node as any).isAdd) {
      //node.id = -1;
      delete (node as any).isAdd;
    }

    // Step 3: Visit all children recursively
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this.saveAssignments(child);
      }
    }
    this.cdRef.detectChanges();
  }

  saveNodeAssignments(node:NodeModel): void {
    this.saveAssignments(node);
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project);
    this.projectManagementService.updateProject(project);
  }

  onAttributeChanged(node: NodeModel, attributeName: string, event: any): void {
    const assignment = node.assignments?.find(a => a.attribute?.directName === attributeName);
    if (assignment) {
      (assignment as any).tempValue = event;
    }
    this.cdRef.detectChanges();
  }

  get changeDetector() {
    return this.nodeService;
  }

  updateProjectNodeReference(project: Project): void {
      if (!project?.node?.length) return;

      if (this.selectedInterface) {
        this.nodeService.updateNodeInTree(project.node, this.selectedInterface);
      }

      // if (this.selectedVariant) {
      //   this.nodeService.updateNodeInTree(project.node, this.selectedVariant);
      // }
    }
    protected readonly String = String;
}
