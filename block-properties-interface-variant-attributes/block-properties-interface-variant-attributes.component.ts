import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Subject } from 'rxjs';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { TruncatePipe } from 'app/core/pipes/truncate.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { BlockPropertiesUcResourceRequirementsComponent } from '../block-properties-uc-resource-requirements/block-properties-uc-resource-requirements.component';
import { GButtonModule, GCheckboxModule, Size, Type } from '@bosch/rbang';
import { TooltipModule } from 'primeng/tooltip';
import { ScrollIntoViewDirective } from '../../../directives/scroll-into-view.directive';
import { CommonModule, NgClass } from '@angular/common';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';
import { FormsModule } from '@angular/forms';
import { NodeService } from 'app/core/services/node.service';
import { Project } from 'app/core/models/project.model';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { AssignmentModel } from 'app/core/models/dynamic-attributes/assignment.model';
import { AssignmentUtils } from 'app/core/services/search/assignment.util';
import { NodeEditService } from 'app/features/block-diagram/services/node-edit.service';
import { AttributeService } from 'app/core/services/attribute-service';
import { mockAttributes } from 'app/core/models/mockAttributes';
import { mockSubtypes } from 'app/core/models/subtypesMock';
import {  ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';

@Component({
  selector: 'app-block-properties-interface-variant-attributes',
  templateUrl: './block-properties-interface-variant-attributes.component.html',
  styleUrls: ['./block-properties-interface-variant-attributes.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    GButtonModule,
    ScrollIntoViewDirective,
    NgClass,
    TooltipModule,
    GCheckboxModule,
    BlockPropertiesUcResourceRequirementsComponent,
    TranslateModule,
    TruncatePipe,
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
  ],
})
export class BlockPropertiesInterfaceVariantAttributesComponent implements OnInit, OnDestroy {


  interface?: NodeModel;
  selectedVariant?: NodeModel;
  selectedResource?: NodeModel;
  textSize = 12;
  notifier = new Subject<void>();
  characterThreshold = 2;
  buttonSize: Size = Size.MEDIUM;
  attrButtonSize: Size = Size.SMALL;
  buttonType = Type;
  assignmentUtils = AssignmentUtils;
  modifiedStateMap: any;
  showDeleteConfirm = false;
  variantToDelete: NodeModel | null = null;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService ,
    private blockPropertiesInterfaceContext: BlockPropertiesInterfaceContextService,
    private blockDiagramHighlightService: BlockDiagramHighlightService,
    private nodeService: NodeService,
    private projectManagementService: ProjectManagementService,
    private cdRef: ChangeDetectorRef,
    private nodeEditService: NodeEditService,
    private propertiesPanelService: PropertiesPanelService,
  ) {}

  ngOnInit(): void {
    this.subscribeToInterfaceChange();
    this.subscribeToVariantChange();
    this.subscribeToResourceChange();
    this.nodeEditService.registerCommitFunction(() => this.commitInterfaceChanges());
   // this.nodeEditService.registerResetFunction(() => this.resetInterfaceChanges());
    this.cdRef.detectChanges()
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  confirmDelete(): void {
    if (this.variantToDelete) {
      this.performVariantDeletion(this.variantToDelete);
    }
    this.showDeleteConfirm = false;
    this.variantToDelete = null;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.variantToDelete = null;
  }

  private performVariantDeletion(variant: NodeModel): void {
    // Backend delete if variant has a positive ID
    if (variant.id && variant.id > 0) {
      this.nodeService.deleteNodesByIds([variant.id]).subscribe({
        next: () => this.removeVariantFromUI(variant),
        error: err => console.error('❌ Failed to delete variant from backend:', err)
      });
      this.commitInterfaceChanges();
    } else {
      // Soft delete from UI only
      this.removeVariantFromUI(variant);
      this.commitInterfaceChanges();
    }
  }

  private removeVariantFromUI(variant: NodeModel): void {
    const index = this.interface?.children?.indexOf(variant);
    if (index !== undefined && index !== -1) {
      this.interface?.children?.splice(index, 1);
      if (this.selectedVariant?.id === variant.id) {
        this.selectedVariant = undefined;
      }
    }
  }
  onDeleteClick(variant: NodeModel): void {
    const rbName = this.assignmentUtils.getValue(variant, 'rbName');
    const hasName = !!rbName;
    const isPersistedNode = variant.id !== undefined && variant.id !== null && variant.id > 0;

    // Case 1: If variant has no name or ID — delete silently
    if (!hasName || !isPersistedNode) {
      this.removeVariantFromUI(variant);
      this.commitInterfaceChanges();
      return;
    }
    this.confirmationService.confirm({
      key: 'variantDeleteConfirm',
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete variant "${this.assignmentUtils.getRbName(variant)}"?`,
      acceptLabel: 'Yes',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.performVariantDeletion(variant);
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Variant removed'
        });
      }
    });
  }

  async addInterfaceVariant(): Promise<void> {
    if (!this.interface) return;
    // Clone the parent to avoid modifying shared reference
    const interfaceClone = structuredClone(this.interface);
    interfaceClone.children=[]
    this.nodeService.removeParentNodeEverywhere(interfaceClone);

    this.nodeService.getNodeTemplate('interfaceVariant', interfaceClone).subscribe({
      next: newVariant => {
        this.nodeService.markAsTemporary(newVariant);
        this.interface?.children?.push(newVariant);
        this.selectVariant(newVariant);
      },
      error: err => {
        console.error('Add Node API failed:', err);
      }
    });
  }

  resetSingleInterfaceVariant(interfaceVariantNode: NodeModel): void {
    this.propertiesPanelService.displayLoadingIndicator();
    this.nodeService.resetParentAndChildNodes(interfaceVariantNode);
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project);
    this.projectManagementService.updateProject(project);
    this.cdRef.detectChanges();
  }
  getIsUsedRadioState(variant: NodeModel): boolean {
    const assignment = variant.assignments?.find(a => a.attribute?.directName === 'isSelected');
    const val = (assignment as any)?.tempValue ?? assignment?.value ?? assignment?.libraryValue;
    return val === 'true';
  }
  onVariantRadioClicked(node: NodeModel, selectedVariant: NodeModel): void {
    node.children?.forEach(variant => {
      const isUsedAssignment = variant.assignments?.find(a => a.attribute?.directName === 'isSelected');
      if (isUsedAssignment) {
        (isUsedAssignment as any).tempValue = (variant === selectedVariant) ? 'true' : 'false';
      }
    });
  }


  // get isModified(): boolean {
  //   return this.interface ? this.nodeService.isNodeModified(this.interface) : false;
  // }

  // getAttributeBindingValue(assignment: AssignmentModel): string {
  //   const temp = (assignment as any).tempValue;
  //   if (temp !== undefined && temp !== null) {
  //     return temp;
  //   }
  //   return assignment.value != null ? assignment.value : assignment.libraryValue ?? '';
  // }

  // setAttributeBindingValue(assignment: AssignmentModel, val: string): void {
  //   (assignment as any).tempValue = val;
  // }


  onAttributeChanged(node: NodeModel, attributeName: string, value: any): void {
    const assignment = node.assignments?.find(
      a => a.attribute?.directName === attributeName
    );
    if (assignment) {
      (assignment as any).tempValue = value;
      this.cdRef.detectChanges()
      //this.assignmentChange$.next();
    }

  }

  updateProjectNodeReference(project: Project): void {
    if (!project?.node?.length) return;

    if (this.interface) {
      this.nodeService.updateNodeInTree(project.node, this.interface);
    }

    if (this.selectedVariant) {
      this.nodeService.updateNodeInTree(project.node, this.selectedVariant);
    }
    this.cdRef.detectChanges();
  }


   isInterfaceDirty(interfaceToUc: NodeModel): boolean {
    return this.nodeService.hasModifiedAssignments(interfaceToUc)
    // return this.interface?.assignments?.some(a => {
    //   const tempValue = (a as any).tempValue;
    //   const value = a.value ;
    //   const original = a.libraryValue ?? '';

    //   // If tempValue is set and differs from value, it's a real modification
    //   if (tempValue !== undefined && tempValue !== value && tempValue !== original) {
    //     return true;
    //   }
    //   if(value === null)return false
    //   // Otherwise, fallback to comparing current with original
    //   const current = tempValue ?? value;
    //   return current !== original;
    // }) ?? false;
  }

  resetInterfaceChanges(): void {
    if (this.interface) {
      this.nodeService.resetParentNode(this.interface);
    }
    //if (!this.interface) return;
    this.commitInterfaceChanges();
    //this.saveAssignments(this.interface)
    //this.assignmentChange$.next();
  }

  selectVariant(interfaceVariant: NodeModel): void {
    this.selectedVariant = interfaceVariant;
    this.blockPropertiesInterfaceContext.changeVariant(interfaceVariant);
    this.blockPropertiesInterfaceContext.changeResource();
    this.blockDiagramHighlightService.selected?.next(interfaceVariant);
    this.blockDiagramHighlightService.highlighted.next(interfaceVariant);
    this.blockDiagramHighlightService.selection.next(String(this.assignmentUtils.getValue(interfaceVariant, 'rbName')));
    this.cdRef.detectChanges();
  }

  checkForAttribute(attribute: string): string {
    return this.blockPropertiesInterfaceContext.checkForAttribute(attribute);
  }
  getRbName(variant: NodeModel): string {
    return variant?.assignments?.find(
      (a: any) => a.attribute?.directName === 'rbName'
    )?.value || '';
  }
  private subscribeToResourceChange() {
    this.blockPropertiesInterfaceContext.resourceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((resource) => {
        this.selectedResource = resource;
      });
  }

  private subscribeToVariantChange() {
    this.blockPropertiesInterfaceContext.variantChange
      .pipe(takeUntil(this.notifier))
      .subscribe((variant) => {
          this.selectedVariant = variant;
      });
  }

  resetAttributeValue(assignment: any): void {
    this.assignmentUtils.resetAttributeValue(assignment);
    this.cdRef.detectChanges();
  }
  hasModifiedAssignments(interfaceVariant: NodeModel): boolean {
    return this.nodeService.hasModifiedAssignments(interfaceVariant) ;
  }
  private subscribeToInterfaceChange() {
    this.blockPropertiesInterfaceContext.interfaceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((interface2Uc) => {
        this.interface = interface2Uc;
      });
  }

  trackById(index: number, item: NodeModel) {
    return item.id;
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


  commitInterfaceChanges(): void {
    if (!this.interface) return;
    this.propertiesPanelService.displayLoadingIndicator();
    this.saveAssignments(this.interface); // apply tempValue to value
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project); // update the node structure
    this.projectManagementService.updateProject(project);
  }


  // async saveInterfaceAssignments(): Promise<void> {
  //   this.saveAssignments();
  //   const project = this.projectManagementService.getProject();
  //   this.updateProjectNodeReference(project);
  //   this.projectManagementService.updateProject(project);
  //   this.cdRef.detectChanges();
  // }
}
