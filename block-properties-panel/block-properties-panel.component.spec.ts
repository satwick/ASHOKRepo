import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPropertiesPanelComponent } from 'app/core/components/block-properties-components/block-properties-panel/block-properties-panel.component';
import { MessageModule } from 'primeng/message';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FunctionModule } from 'app/core/models/design-object/function-module.model';
import { By } from '@angular/platform-browser';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('BlockPropertiesPanelComponent', () => {
  let component: BlockPropertiesPanelComponent;
  let fixture: ComponentFixture<BlockPropertiesPanelComponent>;
  let blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesPanelComponent,
        MessageModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();

    blockPropertiesInterfaceContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );

    fixture = TestBed.createComponent(BlockPropertiesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the rbang-tabpanel if functionModule is not reserved', () => {
    blockPropertiesInterfaceContextService.functionModuleChange.next({
      name: 'BS_eMGS3325',
    } as FunctionModule);
    fixture.detectChanges();
    const rbangTabPanel = fixture.debugElement.query(By.css('rbang-tabpanel'));
    expect(rbangTabPanel).toBeFalsy();
  });

  it('should not display the rbang-tabpanel if functionModule is reserved', () => {
    blockPropertiesInterfaceContextService.functionModuleChange.next({
      name: 'RESERVED_INTERNAL_SIGNAL',
    } as FunctionModule);
    fixture.detectChanges();
    const rbangTabPanel = fixture.debugElement.query(By.css('rbang-tabpanel'));
    expect(rbangTabPanel).toBeNull();
  });
});
