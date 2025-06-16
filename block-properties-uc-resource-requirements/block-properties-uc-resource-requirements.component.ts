import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Subject } from 'rxjs';
import DropdownObject from 'app/core/models/dropdown-object.model';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { Project, ProjectMode } from 'app/core/models/project.model';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { GButtonModule, GCheckboxModule, GDirectDropdownModule, Size } from '@bosch/rbang';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { BlockDiagramTableService } from 'app/features/block-diagram/services/block-diagram-table.service';
import { RequirementDropdown } from 'app/core/components/block-properties-components/block-properties-uc-resource-requirements/requirement-dropdown';
import { takeUntil } from 'rxjs/operators';
import {
  Microcontroller,
  OUT_SW_MSC,
  ResourceGroup,
  VariantType,
} from 'app/core/models/microcontroller.model';
import { ADC_TRIGGER_1MS
} from 'app/features/block-diagram/services/interface.service';
import { OptionalResourceMappingService } from 'app/core/services/optional-resource-mapping.service';
import { TranslateModule } from '@ngx-translate/core';
import { BlockPropertiesUcResourceAttributesComponent } from '../block-properties-uc-resource-attributes/block-properties-uc-resource-attributes.component';
import { ScrollIntoViewDirective } from 'app/core/directives/scroll-into-view.directive';
import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { ResultingCircuitService } from 'app/features/block-diagram/services/resulting-circuit.service';
import { MscService } from 'app/features/bus-concept/services/msc.service';
import { TabSetChannel } from 'app/core/enums/tab-set-channel.enum';
import { DropdownModule } from 'primeng/dropdown';
import { VariantService } from 'app/features/block-diagram/services/variant.service';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';
import { AssignmentModel } from 'app/core/models/dynamic-attributes/assignment.model';
import { AttributeModel } from 'app/core/models/dynamic-attributes/attribute.model';
import { AssignmentUtils } from 'app/core/services/search/assignment.util';
import { FormsModule } from '@angular/forms';
import { NodeTypeModel } from 'app/core/models/dynamic-attributes/nodetype.model';
import { NodeService } from 'app/core/services/node.service';
import { NodeEditService } from 'app/features/block-diagram/services/node-edit.service';

@Component({
  selector: 'app-block-properties-uc-resource-requirements',
  templateUrl: './block-properties-uc-resource-requirements.component.html',
  styleUrls: ['./block-properties-uc-resource-requirements.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    ScrollIntoViewDirective,
    NgClass,
    GCheckboxModule,
    BlockPropertiesUcResourceAttributesComponent,
    GDirectDropdownModule,
    AsyncPipe,
    TranslateModule,
    DropdownModule,
    CommonModule,
    FormsModule,
    GButtonModule
  ],
})
export class BlockPropertiesUcResourceRequirementsComponent
  implements OnInit, OnDestroy
{
  variant?: NodeModel;
  requiredAttributes?: AssignmentModel[];
  assignedAttributes?: AssignmentModel[];
  assignmentUtils = AssignmentUtils;
  optionalResGroups = new Map<number, NodeModel[]>();
  eitherOrGroups: number[] = [];
  resourcesFromNoGroup: NodeModel[] = [];
  selectedResourceRequirement?: NodeModel;
  project: Project = {} as Project;
  buttonSize: Size = Size.MEDIUM;
  resetButtonSize: Size = Size.MEDIUM;
  sarbTriggerSource = new RequirementDropdown();
  tabChannel = new RequirementDropdown();
  setChannel = new RequirementDropdown();
  isAdcTriggerVariant = false;
  hasMSCSettings = false;
  hasSetChannelSettings = false;
  hasTabChannelSettings = false;
  emptyDisplay = '-';
  projectIsEditable = true;
  canAddNew= true;
  resourceClassOptions: { key: string; values: string[] }[] = [];
  private notifier: Subject<void> = new Subject();

  protected readonly ProjectMode = ProjectMode;
  Array: any;

  constructor(
    private blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService,
    private projectManagementService: ProjectManagementService,
    private blockDiagramHighlightService: BlockDiagramHighlightService,
    private propertiesPanelService: PropertiesPanelService,
    public blockDiagramTableService: BlockDiagramTableService,
    private resourceSortService: OptionalResourceMappingService,
    private resultingCircuitService: ResultingCircuitService,
    private mscService: MscService,
    private variantService: VariantService,
    private nodeService: NodeService,
    private cdRef: ChangeDetectorRef,
  ) {}
  isSubtypeDropdown(variant: NodeModel, assignment: AssignmentModel): boolean {
    return (variant as any)?.isAdd && ['signalType', 'type'].includes(assignment.attribute.directName);
  }
  isReadOnlyText(variant: NodeModel, assignment: AssignmentModel): boolean {
    return !(variant as any)?.isAdd && ['signalType', 'type'].includes(assignment.attribute.directName);
  }
  shouldShowRollback(variant: NodeModel, assignment: AssignmentModel): boolean {
    return !(variant as any)?.isAdd && AssignmentUtils.getAttributeBindingValue(assignment) !== assignment.libraryValue;
  }

  ngOnInit(): void {
    if (!this.projectManagementService.hasAProject()) {
      return;
    }
    this.subscribeToVariantChange();
    this.subscribeToResourceChange();
    this.subscribeToProjectChange();
    //this.nodeEditService.registerCommitFunction(() => this.commitInterfaceVaraintChanges());
  }
  isAssignmentEditable(assignment: AssignmentModel,variant: NodeModel) {
    return (assignment as any)?.isAdd || (variant as any)?.isAdd;
  }
  getSubTypeOptions(variant: NodeModel, directName: string): NodeTypeModel[] {
    if (['signalType', 'type'].includes(directName)) {
      return variant.subType ?? [];
    }
    return [];
  }
  getSignalTypeOptions(variant: NodeModel): NodeTypeModel[] {
    const typeValue = this.assignmentUtils.getValue(variant, 'type');
    if (!typeValue || !variant.subType) {
      return [];
    }
    const parentType = variant.subType.find(st => st.label === typeValue);
    return parentType?.subType || [];
  }
  resetInterfaceVariantChanges(): void {
    if (this.variant) {
      this.nodeService.resetParentNode(this.variant);
    }
    this.commitInterfaceVaraintChanges()
    //this.assignmentChange$.next();
  }
  isNodeDirty(interfaceVariant: NodeModel): boolean {
    return this.nodeService.hasModifiedAssignments(interfaceVariant)
  }
  saveAssignments(): void {
    this.variant?.assignments?.forEach(a => {
      if ((a as any).tempValue !== undefined) {
        a.value = (a as any).tempValue;
       delete (a as any).tempValue;
      }
    });
    this.cdRef.detectChanges();
  }
  private subscribeToVariantChange() {
    this.blockPropertiesInterfaceContextService.variantChange
      .pipe(takeUntil(this.notifier))
      .subscribe((interfaceVariant) => {
          this.updateVariantAndFillDropdowns(interfaceVariant);
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

  isEmptyValue(value: any): string {
    // If it's a stringified empty array like "[]"
    if (typeof value === 'string' && value.trim() === '[]') {
      return '-';
    }

    if (Array.isArray(value)) {
      const cleanedArray = value.filter(v => v !== null && v !== undefined && v !== '');
      return cleanedArray.length === 0 ? '-' : cleanedArray.join(', ');
    }

    return value === null || value === undefined || value === '' ? '-' : value;
  }

  commitInterfaceVaraintChanges(): void {
    this.saveAssignments(); // apply tempValue to value
    const project = this.projectManagementService.getProject();
    this.updateProjectNodeReference(project); // update the node structure
    this.projectManagementService.updateProject(project);
  }
  updateProjectNodeReference(project: Project): void {
    if (!project?.node?.length) return;
    if (this.variant) {
      this.nodeService.updateNodeInTree(project.node, this.variant);
    }
    this.cdRef.detectChanges();
  }

  resetAttributeValue(assignment: any): void {
    this.assignmentUtils.resetAttributeValue(assignment);
    this.cdRef.detectChanges();
  }

  private updateVariantAndFillDropdowns(interfaceVariant: NodeModel) {
    if (!interfaceVariant || !interfaceVariant.assignments) {
      return;
    }
    this.variant = interfaceVariant;
    this.updateVariantAttributes();
    this.mapVariantResources();
    this.updateSettingsAndDropdowns();
  }

  private updateSettingsAndDropdowns() {
    if (!this.variant) {
      return;
    }
    this.isAdcTriggerVariant = this.assignmentUtils.getValue(this.variant, 'rbName') === ADC_TRIGGER_1MS;
    this.hasMSCSettings = this.assignmentUtils.getValue(this.variant, 'type') === VariantType.PSO;
    this.fillSarbTriggerDropdown();
    this.fillTabSetChannelDropdowns();
  }

  private subscribeToResourceChange() {
    this.blockPropertiesInterfaceContextService.resourceChange
      .pipe(takeUntil(this.notifier))
      .subscribe((resource) => {
        this.selectedResourceRequirement = resource;
        this.fillSarbTriggerDropdown();
      });
  }
  getAssignmentValue(node: NodeModel, key: string): string {
    const value = AssignmentUtils.getValue(node, key);
    return typeof value === 'string' ? value : '';
  }

  getAssignmentArray(node: NodeModel, key: string): string[] {
    const value = AssignmentUtils.getValue(node, key);
    return Array.isArray(value) ? value : [];
  }
  private subscribeToProjectChange() {
    this.projectManagementService
      .getProjectNotifier()
      .pipe(takeUntil(this.notifier))
      .subscribe((project) => {
        this.initializeProjectState(project);
        this.updateVariant();
        this.fillSarbTriggerDropdown();
        this.fillTabSetChannelDropdowns();
      });
  }

  private initializeProjectState(project: Project) {
    this.project = project;
    this.projectIsEditable =
      project.projectVersion?.status == ProjectMode.EDITABLE;
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  private updateVariant() {
    const newVariant = this.variantService.searchForVariantById(
      this.variant?.id ?? -1,
      this.resultingCircuitService.sortedVariants
    );
    if (newVariant) {
      this.blockPropertiesInterfaceContextService.changeVariant(newVariant);
    }
  }

  private updateVariantAttributes() {
    const assignments = this.variant?.assignments ?? [];
    this.requiredAttributes = assignments.filter(
      (a) => a.libraryValue !== undefined && a.libraryValue !== null
    );
    this.assignedAttributes =  assignments.filter(
      (a) => a.value !== undefined && a.value !== null
    );
  }
//revisit
  selectResourceRequirement(resourceRequirement: NodeModel): void {
    this.selectedResourceRequirement = resourceRequirement;
    this.blockPropertiesInterfaceContextService.changeResource(
      resourceRequirement
    );
    this.blockDiagramHighlightService.selected?.next(resourceRequirement);
    this.blockDiagramHighlightService.highlighted.next(resourceRequirement);
    this.blockDiagramHighlightService.selection.next(
      resourceRequirement.name
    );
    this.cdRef.detectChanges();

  }
//need to revisit
  private mapVariantResources() {
    if (!this.variant) {
      return;
    }
    this.resourcesFromNoGroup = (this.variant.children ?? []).filter((child) => child.nodeType?.name === 'resourceRequirement');
    this.optionalResGroups = this.resourceSortService.getSortedGroupsOfOptionalResources((this.variant.children ?? [])
      .filter(child => child.nodeType?.name === 'resourceRequirementGroup'));
    this.eitherOrGroups = Array.from(this.optionalResGroups.keys());
  }

  private fillSarbTriggerDropdown() {
    if (!this.isAdcTriggerVariant) {
      return;
    }
    const sarbTriggerNames = this.getSarbTriggers();
    this.sarbTriggerSource.addOptions(sarbTriggerNames);
    this.sarbTriggerSource.initialValueName =
      this.getSarbTriggerInitialValue(sarbTriggerNames);
    this.sarbTriggerSource.selectedDropdownObject =
      this.sarbTriggerSource.initialDropdownObject;
    if (
      this.sarbTriggerSource.selectedDropdownObject.name !==
      this.project.sarbTriggerSource
    ) {
      this.changeDropdownSarbTrigger(
        this.sarbTriggerSource.selectedDropdownObject
      );
    }
  }

  fillTabSetChannelDropdowns() {
    this.fillTabOrSetChannelDropdown(TabSetChannel.TabChannel, this.variant);
    this.fillTabOrSetChannelDropdown(TabSetChannel.SetChannel, this.variant);
    this.setDropdownVisibility();
  }

  // fillTabOrSetChannelDropdown(
  //   tabOrSetChannel: TabSetChannel,
  //   variant?: NodeModel
  // ) {

  //   const tabOrSetChannelValues =
  //     variant?.requiredAttributes[tabOrSetChannel].values ?? [];
  //   const tabOrSetChannelSelectedValue =
  //     variant?.requiredAttributes[tabOrSetChannel].selectedValue;
  //   if (tabOrSetChannel === TabSetChannel.TabChannel) {
  //     this.handleTabOrSetChannel(
  //       this.tabChannel,
  //       tabOrSetChannelValues,
  //       tabOrSetChannelSelectedValue
  //     );
  //   }
  //   if (tabOrSetChannel === TabSetChannel.SetChannel) {
  //     this.handleTabOrSetChannel(
  //       this.setChannel,
  //       tabOrSetChannelValues,
  //       tabOrSetChannelSelectedValue
  //     );
  //   }
  // }
  //need to revisit
  fillTabOrSetChannelDropdown(tabOrSetChannel: TabSetChannel, variant?: NodeModel): void {
    if (!variant) return;

    const assignment = variant.assignments?.find(
      (a) => a.attribute?.directName === tabOrSetChannel
    );

    const tabOrSetChannelValues: string[] = assignment?.value?.split(',') ?? [];
    const libraryValue = assignment?.libraryValue ?? '';


    if (tabOrSetChannel === TabSetChannel.TabChannel) {
      this.handleTabOrSetChannel(this.tabChannel, tabOrSetChannelValues, libraryValue);
    }

    if (tabOrSetChannel === TabSetChannel.SetChannel) {
      this.handleTabOrSetChannel(this.setChannel, tabOrSetChannelValues, libraryValue);
    }
  }
  onAttributeChanged(node: NodeModel, attributeName: string, value: any): void {
    const assignment = node.assignments?.find(
      a => a.attribute?.directName === attributeName
    );
    if (assignment) {
      (assignment as any).tempValue = value;
    }
    this.saveAssignments()
    this.cdRef.detectChanges();
  }

  private handleTabOrSetChannel(
    reqDropdown: RequirementDropdown,
    tabOrSetChannelValues: string[],
    tabOrSetChannelSelectedValue?: string
  ) {
    this.addDropdownOptions(reqDropdown, tabOrSetChannelValues);
    const foundSelectedValue = reqDropdown.options.find(
      (option) => option.name === tabOrSetChannelSelectedValue
    );
    if (foundSelectedValue) {
      reqDropdown.updateRequirement(undefined, foundSelectedValue);
    }
  }

  private addDropdownOptions(
    requirementDropdown: RequirementDropdown,
    values: string[]
  ) {
    requirementDropdown.addOptions(values);
    requirementDropdown.initialValueName = 'Any';
  }

  private getSarbTriggerInitialValue(sarbTriggerNames: string[]): string {
    if (sarbTriggerNames.length === 0) {
      return '';
    }
    if (
      this.project.sarbTriggerSource &&
      sarbTriggerNames.includes(this.project.sarbTriggerSource)
    ) {
      return this.project.sarbTriggerSource;
    }
    return sarbTriggerNames[0];
  }

  public getSarbTriggers(): string[] {
    if (!this.projectManagementService.hasAProject()) {
      return [];
    }
    const regExpForIFX = /^SAR\d+_Trig\d+$/;
    const regExpForST = /^SARB_Trig$/;
    const combinedRegex = new RegExp(
      regExpForIFX.source + '|' + regExpForST.source
    );

    const resourceGroups = this.getResourceGroups(this.project.microcontroller);
    const groupNames = resourceGroups
      .filter((resGroup) => RegExp(combinedRegex).exec(resGroup.name))
      .map((resGroup) => resGroup.name)
      .sort(this.compareLastDigits);

    return [...new Set(groupNames)];
  }

  private getResourceGroups(microcontroller: Microcontroller): ResourceGroup[] {
    if (
      !microcontroller.composedOf ||
      microcontroller.composedOf.length === 0
    ) {
      return microcontroller.resourceGroups ?? [];
    }
    return microcontroller.composedOf.flatMap((uC) => uC.resourceGroups ?? []);
  }

  public compareLastDigits(str1: string, str2: string): number {
    const lastDigitA = parseInt(RegExp(/\d+$/).exec(str1)?.[0] ?? '0');
    const lastDigitB = parseInt(RegExp(/\d+$/).exec(str2)?.[0] ?? '0');

    return lastDigitA - lastDigitB;
  }

  changeDropdownSarbTrigger(changeDropdown: DropdownObject): void {
    if (!this.variant) {
      return;
    }
    this.sarbTriggerSource.updateRequirement(undefined, changeDropdown);
    this.saveProject();
  }

  changeDropdownTabChannel(option: DropdownObject): void {
    if (!this.variant) return;

    this.assignmentUtils.setOrUpdate(this.variant, 'tabChannel', option.name);
    this.tabChannel.updateRequirement(undefined, option);
    this.saveProject();
  }


  changeDropdownSetChannel(option: DropdownObject): void {
    if (!this.variant) return;

    this.assignmentUtils.setOrUpdate(this.variant, 'setChannel', option.name);
    this.setChannel.updateRequirement(undefined, option);
    this.saveProject();
  }

  async saveProject(): Promise<void> {
    if (!this.projectManagementService.hasAProject()) {
      return;
    }
    this.propertiesPanelService.displayLoadingIndicator();
    const newResult = this.projectManagementService.getProject();
    if (this.sarbTriggerSource.selectedDropdownObject) {
      newResult.sarbTriggerSource =
        this.sarbTriggerSource.selectedDropdownObject.name;
    }
    if (this.tabChannel.selectedDropdownObject) {
      this.mscService.updateRelatedVariants(
        this.tabChannel.selectedDropdownObject.name,
        TabSetChannel.TabChannel,
        this.variant,
        newResult
      );
    }
    if (this.setChannel.selectedDropdownObject) {
      this.mscService.updateRelatedVariants(
        this.setChannel.selectedDropdownObject.name,
        TabSetChannel.SetChannel,
        this.variant,
        newResult
      );
    }
    this.blockDiagramTableService.resource = undefined;
    this.projectManagementService.updateProject(newResult);
  }
//need to check because variant does not have any index or ordinalNumber
  private setDropdownVisibility() {
    const isNotSwMscVariant = !this.assignmentUtils.getCombinedName(this.variant).includes(OUT_SW_MSC);
    this.hasSetChannelSettings =
      this.hasMSCSettings &&
      true &&
      this.setChannel.options.length > 1;
    this.hasTabChannelSettings =
      this.hasMSCSettings &&
      true &&
      this.tabChannel.options.length > 1;
  }

  strikeResource(node: NodeModel | undefined) {
    if(node){
      if(node.directId ){
        const isUsed = this.assignmentUtils.getValue(node, 'isUsed')
        if(isUsed==='true'){
          this.assignmentUtils.setOrUpdate(node, 'isUsed', 'false')
        }else {
          this.assignmentUtils.setOrUpdate(node, 'isUsed', 'true')
        }

      }
      else{
        this.propertiesPanelService.displayLoadingIndicator();
        this.removeVariantFromUI(node);
      }
    }
    const project = this.projectManagementService.getProject();
    if (!project?.node?.length) return;
    if(this.variant)
    this.nodeService.updateNodeInTree(project.node, this.variant);// update the node structure
    this.projectManagementService.updateProject(project);
    this.mapVariantResources();
  }
  removeVariantFromUI(node: NodeModel): void {
    const index = this.variant?.children?.indexOf(node);
    if (index !== undefined ) {
      this.variant?.children?.splice(index, 1);
      if (this.selectedResourceRequirement?.id === node.id) {
        this.selectedResourceRequirement = undefined;
      }
    }
  }
  // deleteNewResource(node: NodeModel){
  //   if(!this.variant)
  //     return;
  //   this.variant.children = (this.variant.children ?? []).filter(child => child !== node);
  // }

  // async addResource(): Promise<void> {
  //   this.canAddNew = false
  //   if (!this.variant) return;
  //   const variantClone = structuredClone(this.variant);
  //   this.nodeService.removeParentNodeEverywhere(variantClone);
  //   this.nodeService.getNodeTemplate('resourceRequirement', variantClone).subscribe({
  //     next: newResource => {
  //       if (!this.variant) return;
  //       const res = new NodeModel();
  //       res.assignments = newResource.assignments;
  //       this.assignmentUtils.setOrUpdate(res,'isUsed','true');
  //       res.nodeType = newResource.nodeType;
  //       this.nodeService.markAsTemporary(res);
  //       this.variant.children = [...(this.variant?.children ?? []), res];
  //       this.mapVariantResources();
  //       this.selectResourceRequirement(res);
  //     },
  //     error: err => {
  //       console.error('Add Node API failed:', err);
  //     }
  //   });
  // }

  async addResource(): Promise<void> {
    this.canAddNew = false;
    if (!this.variant) return;

    try {
      // Step 1: Fetch resource class options
      this.nodeService.getResourceClassOptions().subscribe({
        next: options => {
          this.resourceClassOptions = options;  // Save to use in dropdown
          if (!this.variant) return;
          // Step 2: Clone variant and remove parent
          const variantClone = structuredClone(this.variant);
          variantClone.children =[]
          this.nodeService.removeParentNodeEverywhere(variantClone);
          // Step 3: Fetch node template

          this.nodeService.getNodeTemplate('resourceRequirement', variantClone).subscribe({
            next: newResource => {
              if (!this.variant) return;
              const res = new NodeModel();
              res.assignments = newResource.assignments;
              this.assignmentUtils.setOrUpdate(res, 'isUsed', 'true');
              res.nodeType = newResource.nodeType;
              res.parentNode = newResource.parentNode
              this.nodeService.markAsTemporary(res);
              const clone = structuredClone(this.variant);
              clone.children = [...(clone.children ?? []), res];
              this.variant = clone;

              this.mapVariantResources();
              this.selectResourceRequirement(res);
            },
            error: err => {
              console.error('Node Template fetch failed:', err);
            }
          });
        },
        error: err => {
          console.error('Fetching resource class options failed:', err);
        }
      });
    } catch (error) {
      console.error('Add resource failed:', error);
    }
  }

  // addResource() {
  //   this.canAddNew = false
  //   if(!this.variant)
  //     return;
  //   const newResource = new NodeModel();
  //   newResource.nodeType.name = 'resourceRequirement';
  //   this.variant.children = [...(this.variant?.children ?? []), newResource];
  //   this.mapVariantResources();
  //   this.selectedResourceRequirement = newResource;
  //   this.blockPropertiesInterfaceContextService.changeResource(
  //     newResource
  //   );
  // }



  deleteResGroup(group: number) {
    if(!this.variant)
      return;
    const groupToRemove = this.variant.children?.find(grp => grp.name === String(group))
    this.variant.children = (this.variant.children ?? []).filter(child => child !== groupToRemove);
    const project = this.projectManagementService.getProject();
    if (!project?.node?.length) return;
    if(this.variant)
    this.nodeService.updateNodeInTree(project.node, this.variant);// update the node structure
    this.projectManagementService.updateProject(project);
    this.mapVariantResources();
  }

  
  strikeResourceFromGroup(node: NodeModel | undefined, group: number){
    if(node){
      if(node.directId === 0 || node.directId === undefined){
        this.propertiesPanelService.displayLoadingIndicator();
        this.deleteNewResFromGroup(node, group);
      }
      else{
        const isUsed = this.assignmentUtils.getValue(node, 'isUsed')
        if(isUsed==='true'){
          this.assignmentUtils.setOrUpdate(node, 'isUsed', 'false')
        }else {
          this.assignmentUtils.setOrUpdate(node, 'isUsed', 'true')
        }
      }
    }
    const project = this.projectManagementService.getProject();
    if (!project?.node?.length) return;
    if(this.variant)
    this.nodeService.updateNodeInTree(project.node, this.variant);// update the node structure
    this.projectManagementService.updateProject(project);
    this.mapVariantResources();
  }

  deleteNewResFromGroup(node: NodeModel, group:number){
    if(!this.variant)
      return;
    const resourceGroup = this.variant.children?.find(grp => grp.name === String(group))
    if(resourceGroup){
      resourceGroup.children = (resourceGroup.children??[]).filter(child => child !== node);
    }
  }
  async addResourceGroup(): Promise<void> {
    this.canAddNew = false;
    if (!this.variant) return;

    try {
      const variantClone = structuredClone(this.variant);
      this.nodeService.removeParentNodeEverywhere(variantClone);

      this.nodeService.getNodeTemplate('resourceRequirementGroup', variantClone).subscribe({
        next: newGroup => {
          const group = new NodeModel();
          group.assignments = newGroup.assignments;
          group.nodeType = newGroup.nodeType;
          group.parentNode = newGroup.parentNode;
          this.nodeService.markAsTemporary(group);

          // ✅ Assign name using the eitherOrGroups logic
          const newName = this.eitherOrGroups[this.eitherOrGroups.length - 1] + 1;
          group.name = String(newName);

          // Add group to variant
          const updatedVariant = structuredClone(this.variant);
          if(updatedVariant)
          updatedVariant.children = [...(updatedVariant.children ?? []), group];

          // Update state
          this.variant = updatedVariant;
          this.mapVariantResources();
          this.blockPropertiesInterfaceContextService.changeResource(group);
        },
        error: err => {
          console.error('Failed to fetch group template:', err);
        }
      });
    } catch (err) {
      console.error('Add resource group failed:', err);
    }
  }
  async addResourceToGroup(group: number): Promise<void> {
    this.canAddNew = false;
    if (!this.variant) return;

    const groupNode = this.variant.children?.find(child =>
      child.nodeType?.name === 'resourceRequirementGroup' &&
      child.name === String(group)
    );

    if (!groupNode) {
      console.warn(`Group "${group}" not found in variant.`);
      return;
    }

    try {
      const groupClone = structuredClone(groupNode);
      this.nodeService.removeParentNodeEverywhere(groupClone);

      this.nodeService.getNodeTemplate('resourceRequirement', groupClone).subscribe({
        next: newResource => {
          const res = new NodeModel();
          res.assignments = newResource.assignments;
          res.nodeType = newResource.nodeType;
          res.parentNode = newResource.parentNode;
          this.assignmentUtils.setOrUpdate(res, 'isUsed', 'true');
          this.nodeService.markAsTemporary(res);

          const updatedVariant = structuredClone(this.variant);
          const updatedGroup = updatedVariant?.children?.find(child =>
            child.nodeType?.name === 'resourceRequirementGroup' &&
            child.name === String(group)
          );

          if (!updatedGroup) {
            console.warn(`Group "${group}" not found in cloned variant.`);
            return;
          }

          updatedGroup.children = [...(updatedGroup.children ?? []), res];

          this.variant = updatedVariant;
          this.mapVariantResources();
          this.selectResourceRequirement(res);
          this.blockPropertiesInterfaceContextService.changeResource(res);
        },
        error: err => {
          console.error('Failed to fetch resource template:', err);
        }
      });
    } catch (err) {
      console.error('Add resource to group failed:', err);
    }
  }
  checkForGroupsOrigin(group: number) {
    const allGroups = (this.variant?.children??[]).filter(group => group.nodeType.name === 'resourceRequirementGroup');
    const toCheck = allGroups.find(grp => grp.name === String(group))
    if(toCheck){
      return toCheck.directId !== 0 ;
    }
    return true;
  }

  checkForResOrigin(node: NodeModel | undefined){
    if(node)
      return node.directId === 0;
    return false;
  }
}
