import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPropertiesUcResourceAttributesComponent } from './block-properties-uc-resource-attributes.component';
import { ResourceRequirement } from 'app/core/models/design-object/resource-requirement.model';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { GButtonModule } from '@bosch/rbang';
import { TestDataModel } from 'app/core/components/block-properties-components/test-data.model';
import { InterfaceVariant } from 'app/core/models/design-object/interface-microcontroller.model';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { OAuthModule } from 'angular-oauth2-oidc';
import { ProjectManagementService } from 'app/features/data-management/app-state/services/project-management.service';
import { getTestProject } from 'app/features/data-management/app-state/dummy-model-instances/projectExample';
import { ProjectMode, ProjectVersion } from 'app/core/models/project.model';

describe('BlockPropertiesUcResourceAttributesComponent', () => {
  let component: BlockPropertiesUcResourceAttributesComponent;
  let fixture: ComponentFixture<BlockPropertiesUcResourceAttributesComponent>;
  let blockContextService: BlockPropertiesInterfaceContextService;
  let testData: TestDataModel;
  let interfaceVariant: InterfaceVariant;
  let projectManagementService: ProjectManagementService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesUcResourceAttributesComponent,
        HttpClientModule,
        HttpClientTestingModule,
        TooltipModule,
        GButtonModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
        OAuthModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BlockPropertiesUcResourceAttributesComponent
    );
    component = fixture.componentInstance;
    blockContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );
    projectManagementService = TestBed.inject(ProjectManagementService);
    testData = TestBed.inject(TestDataModel);
    fixture.detectChanges();
    interfaceVariant = testData.createDummyVariants()[0];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change value of interface and reflect the subscribers', async () => {
    const resourceToChangeTo: ResourceRequirement = new ResourceRequirement(
      0,
      1,
      'content',
      'content',
      0,
      'content',
      'content',
      'content',
      0,
      false
    );

    blockContextService.changeResource(resourceToChangeTo);
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.resource).toBe(resourceToChangeTo);
  });

  it('should check for value', () => {
    const dummyResources = testData.createDummyResourceRequirements();
    let result = component.checkForOriginalRequirement(
      dummyResources[0],
      'resourceId'
    );
    expect(result).toStrictEqual('TOM');
    result = component.checkForOriginalRequirement(
      testData.dummyResourceRequirementFour,
      'kernel'
    );
    expect(result).toStrictEqual('originalRequirementKernel');

    const dummyVariants = testData.createDummyVariants();

    result = component.checkForAssignedAttribute(
      dummyResources[0],
      'resourceId',
      dummyVariants[0]
    );

    expect(result).toStrictEqual('-');

    dummyVariants[0].assignedAttributes =
      testData.createDummyInterfaceVariantAttribute();

    result = component.checkForAssignedAttribute(
      dummyResources[0],
      'resourceId',
      dummyVariants[0]
    );

    expect(result).toStrictEqual('TOM');
  });

  it('configure resource btn should be active', () => {
    const testProject = getTestProject();
    jest
      .spyOn(projectManagementService, 'getProjectReadOnly')
      .mockReturnValue(testProject);
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = true;
    component.resource = testData.createDummyResourceRequirement(
      'GTM_IN',
      'TOM',
      '1',
      '1'
    );
    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeTruthy();
  });

  it('configure resource btn should be active when subclass is SPI and ID is different from SLSO', () => {
    const testProject = getTestProject();
    jest
      .spyOn(projectManagementService, 'getProjectReadOnly')
      .mockReturnValue(testProject);
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = true;
    component.resource = testData.createDummyResourceRequirement(
      'SPI',
      'SIP',
      '1',
      '1'
    );

    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeTruthy();
  });

  it('configure resource btn should be disable when interfaceVariant is not selected', () => {
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = false;
    component.resource = testData.createDummyResourceRequirement(
      'GTM_IN',
      'TOM',
      '1',
      '1'
    );

    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeFalsy();
  });

  it('configure resource btn should be disable when project status is frozen', () => {
    const testProject = getTestProject();
    testProject.projectVersion = {
      status: ProjectMode.FROZEN,
    } as ProjectVersion;
    jest
      .spyOn(projectManagementService, 'getProjectReadOnly')
      .mockReturnValue(testProject);
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = true;
    component.resource = testData.createDummyResourceRequirement(
      'GTM_IN',
      'TOM',
      '1',
      '1'
    );
    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeFalsy();
  });

  it('configure resource btn should be disable when subclass is us_BUS and ResourceID is EN', () => {
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = true;
    component.resource = testData.createDummyResourceRequirement(
      'us_BUS',
      'EN',
      '1',
      '1'
    );

    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeFalsy();
  });

  it('configure resource btn should be disable when subclass is SPI and ID is SLSO', () => {
    component.interfaceVariant = interfaceVariant;
    component.interfaceVariant.isSelected = true;
    component.resource = testData.createDummyResourceRequirement(
      'SPI',
      'SLSO',
      '1',
      '1'
    );

    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeFalsy();
  });

  it('configure resource btn should be disable when no interfaceVariant', () => {
    component.interfaceVariant = undefined;

    component.checkButtonEnabled();
    expect(component.isButtonEnabled).toBeFalsy();
  });
});
