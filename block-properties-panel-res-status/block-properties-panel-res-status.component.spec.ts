import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlockPropertiesPanelResStatusComponent } from 'app/core/components/block-properties-components/block-properties-panel-res-status/block-properties-panel-res-status.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { ResourceRequirement } from 'app/core/models/design-object/resource-requirement.model';
import { TestDataModel } from 'app/core/components/block-properties-components/test-data.model';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';
import { StoreModule } from '@ngrx/store';

const resourceRequirement = new ResourceRequirement(
  0,
  1,
  '',
  '',
  1,
  '',
  '',
  '',
  0,
  false
);

describe('BlockPropertiesPanelResStatusComponent', () => {
  let component: BlockPropertiesPanelResStatusComponent;
  let fixture: ComponentFixture<BlockPropertiesPanelResStatusComponent>;
  let blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService;
  const testDataService: TestDataModel = new TestDataModel();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesPanelResStatusComponent,
        HttpClientModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
        StoreModule.forRoot({}),
        OAuthModule.forRoot(),
      ],
    }).compileComponents();

    blockPropertiesInterfaceContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );
    blockPropertiesInterfaceContextService.resourceChange.next(
      resourceRequirement
    );

    fixture = TestBed.createComponent(BlockPropertiesPanelResStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const dummyResultingCircuit = testDataService.createDummyResultingCircuits();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should should call setResourceValuesForCheckboxSelected method if isIRQSelected', function () {
    component.isIRQSelected = true;
    const calledMethod = jest.spyOn(
      component,
      'setResourceValuesForCheckboxSelected'
    );
    component.updateResource(testDataService.dummyResourceRequirementThree);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('should should call setResourceValuesForCheckboxSelected method if isIRQSelected', function () {
    component.isIRQSelected = true;
    const calledMethod = jest.spyOn(
      component,
      'setResourceValuesForCheckboxSelected'
    );
    component.updateResource(testDataService.dummyResourceRequirementThree);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('should should call setResourceValuesForCheckboxSelected method if isCopySelected', function () {
    component.isCopySelected = true;
    const calledMethod = jest.spyOn(
      component,
      'setResourceValuesForCheckboxSelected'
    );
    component.updateResource(testDataService.dummyResourceRequirementThree);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('should should call setResourceValuesForCheckboxSelected method if isDTMSelected', function () {
    component.isDTMSelected = true;
    const calledMethod = jest.spyOn(
      component,
      'setResourceValuesForCheckboxSelected'
    );
    component.updateResource(testDataService.dummyResourceRequirementThree);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('updateCircuits method should be called when modifyResource is called ', function () {
    const calledMethod = jest.spyOn(component, 'updateCircuits');
    component.modifyResource(dummyResultingCircuit);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('updateResource method should be called when updateCircuits is called ', function () {
    const calledMethod = jest.spyOn(component, 'updateResource');
    component.updateCircuits(dummyResultingCircuit);
    expect(calledMethod).toHaveBeenCalledTimes(42);
  });

  it('updateResourceWhenResetting method should be called when updateCircuitsWhenResetting is called ', function () {
    const calledMethod = jest.spyOn(component, 'updateResourceWhenResetting');
    component.updateCircuitsWhenResetting(dummyResultingCircuit);
    expect(calledMethod).toHaveBeenCalledTimes(42);
  });

  it('updateCircuitsWhenResetting method should be called when modifyResourceWhenResetting is called ', function () {
    const calledMethod = jest.spyOn(component, 'updateCircuitsWhenResetting');
    component.modifyResourceWhenResetting(dummyResultingCircuit);
    expect(calledMethod).toHaveBeenCalledTimes(1);
  });

  it('should update the resource with the values from originalResource, testing this for channel value', function () {
    component.updateResourceWhenResetting(
      testDataService.dummyResourceRequirementFour
    );
    expect(component.resource?.channel).toBe('originalRequirementChannel');
  });
});
