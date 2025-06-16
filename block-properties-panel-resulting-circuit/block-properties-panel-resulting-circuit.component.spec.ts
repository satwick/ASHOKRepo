import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPropertiesPanelResultingCircuitComponent } from './block-properties-panel-resulting-circuit.component';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BlockPropertiesPanelResultingCircuitComponent', () => {
  let component: BlockPropertiesPanelResultingCircuitComponent;
  let fixture: ComponentFixture<BlockPropertiesPanelResultingCircuitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        BlockPropertiesPanelResultingCircuitComponent,
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
      BlockPropertiesPanelResultingCircuitComponent
    );

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
