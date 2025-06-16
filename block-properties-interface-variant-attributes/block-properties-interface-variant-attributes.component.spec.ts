import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlockPropertiesInterfaceVariantAttributesComponent } from './block-properties-interface-variant-attributes.component';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { TruncatePipe } from 'app/core/pipes/truncate.pipe';
import { GCheckboxModule } from '@bosch/rbang';
import { TooltipModule } from 'primeng/tooltip';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ScrollIntoViewDirective } from 'app/core/directives/scroll-into-view.directive';

describe('BlockPropertiesInterfaceVariantAttributesComponent', () => {
  let component: BlockPropertiesInterfaceVariantAttributesComponent;
  let fixture: ComponentFixture<BlockPropertiesInterfaceVariantAttributesComponent>;
  let blockContextService: BlockPropertiesInterfaceContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesInterfaceVariantAttributesComponent,
        TruncatePipe,
        ScrollIntoViewDirective,
        GCheckboxModule,
        TooltipModule,
        HttpClientModule,
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BlockPropertiesInterfaceVariantAttributesComponent
    );
    component = fixture.componentInstance;
    blockContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change value of interface and reflect the subscribers', async () => {
    const interfaceToChangeTo: Interface2Microcontroller =
      new Interface2Microcontroller(
        0,
        1,
        'ABC_Dev2_BGA293IIFX_Dev2_BGA293I',
        '',
        1,
        'DirectInterfaces',
        [
          new InterfaceVariant(
            0,
            1,
            '',
            '',
            '',
            '',
            0,
            '',
            true,
            '',
            new InterfaceVariantAttributes(
              0,
              [],
              ['I', 'O', 'IO', 'Iex'],
              [],
              [],
              [],
              [],
              '',
              '',
              { producer: '', values: [] },
              { producer: '', values: [] },
              [],
              []
            ),
            '',
            '',
            0,
            0,
            false
          ),
        ],
        '',
        '',
        'IFX_Dev2_BGA292',
        '',
        false,
        false,
        '',
        false,
        '',
        '',
        0,
        0,
        false
      );

    const resourceToChangeTo: ResourceRequirement = new ResourceRequirement(
      0,
      1,
      'content',
      '0',
      0,
      'content',
      'content',
      'content',
      0,
      false
    );

    blockContextService.changeInterface(interfaceToChangeTo);
    blockContextService.changeResource(resourceToChangeTo);
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.interface).toBe(interfaceToChangeTo);
    expect(component.selectedResource).toBe(resourceToChangeTo);
  });
});
