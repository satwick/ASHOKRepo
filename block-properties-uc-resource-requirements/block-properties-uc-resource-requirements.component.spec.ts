import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPropertiesUcResourceRequirementsComponent } from './block-properties-uc-resource-requirements.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { MessageService } from 'primeng/api';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { getTestProject } from 'app/features/data-management/app-state/dummy-model-instances/projectExample';

import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';
import { TestDataModel } from '../test-data.model';
import DropdownObject from 'app/core/models/dropdown-object.model';
import { BlockPropertiesInterfaceContextService } from '../block-properties-interface-context.service';
import { By } from '@angular/platform-browser';
import {
  Microcontroller,
  VariantType,
} from 'app/core/models/microcontroller.model';

describe('BlockPropertiesUcResourceRequirementsComponent', () => {
  let component: BlockPropertiesUcResourceRequirementsComponent;
  let fixture: ComponentFixture<BlockPropertiesUcResourceRequirementsComponent>;
  let projectService: ProjectManagementService;
  let interfaceContextService: BlockPropertiesInterfaceContextService;
  const testDataModel = new TestDataModel();

  const resourceGroups = [
    { name: 'SAR0_Trig0', resourceIds: [] },
    { name: 'SAR1_Trig2', resourceIds: [] },
    { name: 'SARB_Trig', resourceIds: [] },
    { name: 'SARBB2_Trigg3', resourceIds: [] },
  ];

  function createDropdownObject(
    code: string | undefined,
    selectedOption?: DropdownObject
  ): DropdownObject {
    return {
      code: code ?? selectedOption?.code ?? '',
      label: code ?? selectedOption?.label ?? '',
      name: code ?? selectedOption?.name ?? '',
    };
  }

  function fillDropdownOption(options: string[]): DropdownObject[] {
    return options.map((nameOption) => {
      return { label: nameOption, name: nameOption, code: nameOption };
    });
  }

  function getSelectedVariant(
    variantsParameter: string | undefined
  ): DropdownObject | undefined {
    if (!variantsParameter) {
      return undefined;
    }
    return {
      name: variantsParameter,
      label: variantsParameter,
      code: variantsParameter,
    };
  }

  function createProjectWithProducers(producers: string[]) {
    const project = Object.assign({}, testDataModel.createDummyProject());
    project.microcontroller = { producer: producers } as Microcontroller;
    return project;
  }

  function createPsoVariant() {
    const variant = Object.assign({}, testDataModel.variantWithOneResource);
    variant.type = VariantType.PSO;
    return variant;
  }

  function getQaElement(debugElement: DebugElement, dataQa: string) {
    return debugElement.query(By.css(`div[data-qa="${dataQa}"`));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesUcResourceRequirementsComponent,
        HttpClientModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
        OAuthModule.forRoot(),
      ],
      providers: [MessageService, ProjectManagementService],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BlockPropertiesUcResourceRequirementsComponent
    );
    projectService = TestBed.inject(ProjectManagementService);
    interfaceContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should convert an array of options into an array of DropdownObjects', () => {
    const options = ['Option 1', 'Option 2', 'Option 3'];
    const result = fillDropdownOption(options);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      label: 'Option 1',
      name: 'Option 1',
      code: 'Option 1',
    });
    expect(result[1]).toEqual({
      label: 'Option 2',
      name: 'Option 2',
      code: 'Option 2',
    });
    expect(result[2]).toEqual({
      label: 'Option 3',
      name: 'Option 3',
      code: 'Option 3',
    });
  });

  it('should return a DropdownObject for the given variant name', () => {
    const variantName = 'variant 1';
    const expectedDropdownOption = {
      name: variantName,
      label: variantName,
      code: variantName,
    };

    expect(getSelectedVariant(variantName)).toEqual(expectedDropdownOption);
  });

  it('should return undefined if no variant name is provided', () => {
    expect(getSelectedVariant(undefined)).toBeUndefined();
  });

  it('should return a DropdownObject with empty values if code and label are not provided', () => {
    const result = createDropdownObject(undefined, undefined);
    expect(result.code).toBe('');
    expect(result.label).toBe('');
    expect(result.name).toBe('');
  });

  it('should use the selectedOption values if code and label are not provided', () => {
    const selectedOption = { code: 'code', label: 'label', name: 'name' };
    const result = createDropdownObject(undefined, selectedOption);
    expect(result.code).toBe(selectedOption.code);
    expect(result.label).toBe(selectedOption.label);
    expect(result.name).toBe(selectedOption.name);
  });

  it('should return list of two SAR_Trig', () => {
    const testProject = getTestProject();
    const microcontroller = testDataModel.createDummyMicrocontroller();
    microcontroller.resourceGroups = resourceGroups;
    testProject.microcontroller = microcontroller;
    component.project = testProject;
    projectService.updateProject(testProject);
    const sarbTriggers = component.getSarbTriggers();
    expect(sarbTriggers.length).toBe(3);
    expect(sarbTriggers).toStrictEqual([
      'SAR0_Trig0',
      'SARB_Trig',
      'SAR1_Trig2',
    ]);
  });

  it('should return empty list when no resourceGroup', () => {
    const testProject = getTestProject();
    const microcontroller = testDataModel.createDummyMicrocontroller();
    microcontroller.resourceGroups = undefined;
    testProject.microcontroller = microcontroller;
    component.project = testProject;

    const sarbTriggers = component.getSarbTriggers();
    expect(sarbTriggers.length).toBe(0);
  });

  it('should return empty list when no project', () => {
    jest.spyOn(projectService, 'hasAProject').mockReturnValue(false);
    const sarbTriggers = component.getSarbTriggers();
    expect(sarbTriggers.length).toBe(0);
  });

  it('should return a negative value if last digit of a is smaller than last digit of b', () => {
    const result = component.compareLastDigits('SAR0_Trig1', 'SAR0_Trig0');
    expect(result).toBeGreaterThan(0);
  });

  it('should return a positive value if last digit of a is greater than last digit of b', () => {
    const result = component.compareLastDigits('SAR0_Trig0', 'SAR0_Trig1');
    expect(result).toBeLessThan(0);
  });

  it('should return 0 if last digits of a and b are equal', () => {
    const result = component.compareLastDigits('SAR0_Trig1', 'SAR0_Trig1');
    expect(result).toBe(0);
  });

  it('should used assigned values for msc and bit when assigned - for now only first bit is used', () => {
    const variant = createPsoVariant();
    const requiredAttributes =
      testDataModel.createDummyInterfaceVariantAttribute();
    requiredAttributes.mscId = ['MSC_related'];
    requiredAttributes.bits = [
      { producer: 'IFX', value: '16' },
      { producer: 'ST', value: '32' },
    ];
    const assignedAttributes = Object.assign({}, requiredAttributes);
    assignedAttributes.mscId = ['MSC1'];
    assignedAttributes.bits = [
      { producer: 'IFX', value: '16' },
      { producer: 'ST', value: '32' },
    ];
    variant.requiredAttributes = requiredAttributes;
    variant.assignedAttributes = assignedAttributes;
    jest.spyOn(projectService, 'hasAProject').mockReturnValue(true);

    component.project = createProjectWithProducers(['IFX']);
    component.ngOnInit();
    interfaceContextService.variantChange.next(variant);
    fixture.detectChanges();

    expect(component.requiredAttributes).toBeDefined();
    expect(component.assignedAttributes).toBeDefined();
    const debugElement = fixture.debugElement;
    const assignedMscIdElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-checkmscid-assigned'
    );
    expect(assignedMscIdElement).not.toBeNull();
    expect(assignedMscIdElement.nativeElement.textContent.trim()).toBe('MSC1');
    const bitTitleElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-i2c-bit'
    );
    expect(bitTitleElement).not.toBeNull();
    expect(bitTitleElement.nativeElement.textContent.trim()).toBe('Bit@IFX');
    const assignedBitElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-checkbitvalue-assigned'
    );
    expect(assignedBitElement).not.toBeNull();
    expect(assignedBitElement.nativeElement.textContent.trim()).toBe('16');
  });

  it('should used reserved values for msc and bit when not assigned', () => {
    const variant = createPsoVariant();
    const requiredAttributes =
      testDataModel.createDummyInterfaceVariantAttribute();
    requiredAttributes.mscId = ['MSC_related'];
    requiredAttributes.bits = [
      { producer: 'IFX', value: '16' },
      { producer: 'ST', value: '32' },
    ];
    variant.requiredAttributes = requiredAttributes;
    variant.assignedAttributes = undefined;
    jest.spyOn(projectService, 'hasAProject').mockReturnValue(true);

    component.project = createProjectWithProducers(['IFX']);
    component.ngOnInit();
    interfaceContextService.variantChange.next(variant);
    fixture.detectChanges();

    expect(component.requiredAttributes).toBeDefined();
    expect(component.assignedAttributes).toBeUndefined();
    const debugElement = fixture.debugElement;
    const reservedMscElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-checkmscid-reserved'
    );
    expect(reservedMscElement).not.toBeNull();
    expect(reservedMscElement.nativeElement.textContent.trim()).toBe(
      'MSC_related'
    );
    const reservedBitElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-checkbitvalue-reserved'
    );
    expect(reservedBitElement).not.toBeNull();
    expect(reservedBitElement.nativeElement.textContent.trim()).toBe('16');
  });

  it('should show SetChannel and TabChannel dropdowns only if values for these exist in requirements for variant', () => {
    const variant = createPsoVariant();
    const requiredAttributes =
      testDataModel.createDummyInterfaceVariantAttribute();
    requiredAttributes.setChannel = {
      producer: 'IFX',
      values: ['Set0_1', 'Set0_2'],
      selectedValue: 'Set0_1',
    };
    requiredAttributes.tabChannel = {
      producer: 'ST',
      values: [],
      selectedValue: 'any',
    };
    variant.requiredAttributes = requiredAttributes;
    jest.spyOn(projectService, 'hasAProject').mockReturnValue(true);

    component.project = createProjectWithProducers(['IFX']);
    component.ngOnInit();
    interfaceContextService.variantChange.next(variant);
    fixture.detectChanges();

    expect(component.requiredAttributes).toBeDefined();
    const debugElement = fixture.debugElement;
    const tabChannelTitleElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-div-tab-channel'
    );
    expect(tabChannelTitleElement).toBeNull();
    const setChannelTitleElement = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-div-set-channel'
    );
    expect(setChannelTitleElement).not.toBeNull();
    const tabChannelDropdown = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-tab-channel-dropdown'
    );
    expect(tabChannelDropdown).toBeNull();
    expect(component.tabChannel.options.length).toBeLessThanOrEqual(1);
    const setChannelDropdown = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-div-set-channel-container'
    );
    expect(setChannelDropdown).not.toBeNull();
    const setChannelDropdownElement = debugElement.query(
      By.css(
        'rbang-direct-dropdown[data-qa="block-properties-uc-resource-requirements-set-channel-dropdown"'
      )
    );
    expect(setChannelDropdownElement).not.toBeNull();
    expect(component.setChannel.options.length).toBeGreaterThan(1);
  });

  it('should set correct selected value and options for assigned SetChannel and TabChannel and show assignment fields', () => {
    const variant = createPsoVariant();
    const requiredAttributes =
      testDataModel.createDummyInterfaceVariantAttribute();
    requiredAttributes.tabChannel = {
      producer: 'ST',
      values: ['Tab1_0', 'Tab1_1', 'Tab1_2'],
      selectedValue: 'any',
    };
    variant.requiredAttributes = requiredAttributes;
    const assignedAttributes =
      testDataModel.createDummyInterfaceVariantAttribute();
    assignedAttributes.tabChannel = {
      producer: 'ST',
      values: ['Tab1_0', 'Tab1_1', 'Tab1_2'],
      selectedValue: 'Tab1_2',
    };
    variant.assignedAttributes = assignedAttributes;
    jest.spyOn(projectService, 'hasAProject').mockReturnValue(true);

    component.project = createProjectWithProducers(['ST']);
    component.ngOnInit();
    interfaceContextService.variantChange.next(variant);
    fixture.detectChanges();
    const debugElement = fixture.debugElement;

    expect(component.assignedAttributes).toBeDefined();
    const assignedSetChannelTitle = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-i2c-assigned-set-channel'
    );
    expect(assignedSetChannelTitle).toBeNull();
    const assignedSetChannelValue = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-assigned-set-channel-value'
    );
    expect(assignedSetChannelValue).toBeNull();
    const assignedTabChannelTitle = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-i2c-assigned-tab-channel'
    );
    expect(assignedTabChannelTitle).not.toBeNull();
    const assignedTabChannelValue = getQaElement(
      debugElement,
      'block-properties-uc-resource-requirements-iv-assigned-tab-channel-value'
    );
    expect(assignedTabChannelValue).not.toBeNull();
    expect(assignedTabChannelValue.nativeElement.textContent.trim()).toBe(
      'Tab1_2'
    );
  });
});
