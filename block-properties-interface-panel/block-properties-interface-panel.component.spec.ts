import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPropertiesInterfacePanelComponent } from './block-properties-interface-panel.component';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { translateLoaderFactory } from 'app/app.module';
import { InterfaceVariantAttributes } from 'app/core/models/design-object/interface-attributes.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InterfaceVariant } from 'app/core/models/design-object/interface-microcontroller.model';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { appReducer } from 'app/core/components/block-properties-components/resource-reference-id/models/app-state.model';
import { OAuthModule } from 'angular-oauth2-oidc';

describe('BlockPropertiesInterfacePanelComponent', () => {
  let component: BlockPropertiesInterfacePanelComponent;
  let fixture: ComponentFixture<BlockPropertiesInterfacePanelComponent>;
  let blockContextService: BlockPropertiesInterfaceContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesInterfacePanelComponent,
        HttpClientTestingModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
        StoreModule.forRoot(appReducer, { initialState: {} }),
        OAuthModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockPropertiesInterfacePanelComponent);
    blockContextService = TestBed.inject(
      BlockPropertiesInterfaceContextService
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change value of variant and reflect the subscribers', async () => {
    const variantToChangeTo: InterfaceVariant = new InterfaceVariant(
      0,
      1,
      'content',
      'content',
      'content',
      'content',
      1,
      'content',
      false,
      'content',
      new InterfaceVariantAttributes(
        0,
        [],
        [],
        [],
        [],
        [],
        [],
        'test',
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
    );

    blockContextService.changeVariant(variantToChangeTo);
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedVariant).toBe(variantToChangeTo);
  });
});
