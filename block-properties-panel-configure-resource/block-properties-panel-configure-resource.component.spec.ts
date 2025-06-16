import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { BlockPropertiesPanelConfigureResourceComponent } from 'app/core/components/block-properties-components/block-properties-panel-configure-resource/block-properties-panel-configure-resource.component';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { TestDataModel } from 'app/core/components/block-properties-components/test-data.model';
import { ChangeDetectorRef } from '@angular/core';
import { HeightChangeService } from 'app/core/services/height-change/height-change.service';
import { By } from '@angular/platform-browser';
import { ConfigureResourceContext } from 'app/core/components/properties-panel/models/configure-resource-context.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { OAuthModule } from 'angular-oauth2-oidc';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { translateLoaderFactory } from 'app/app.module';
import { StoreModule } from '@ngrx/store';
import { EmptyPropertiesPanelComponent } from 'app/core/components/empty-properties-panel/empty-properties-panel.component';

describe('BlockPropertiesPanelConfigureResourceComponent', () => {
  let component: BlockPropertiesPanelConfigureResourceComponent;
  let fixture: ComponentFixture<BlockPropertiesPanelConfigureResourceComponent>;
  let propertiesPanelService: PropertiesPanelService;
  let heightChangeService: HeightChangeService;
  const testDataService: TestDataModel = new TestDataModel();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BlockPropertiesPanelConfigureResourceComponent,
        HttpClientModule,
        HttpClientTestingModule,
        OAuthModule.forRoot(),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: translateLoaderFactory,
            deps: [HttpClient],
          },
        }),
        StoreModule.forRoot({}),
      ],
      providers: [ChangeDetectorRef],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BlockPropertiesPanelConfigureResourceComponent
    );
    propertiesPanelService = TestBed.inject(PropertiesPanelService);
    heightChangeService = TestBed.inject(HeightChangeService);
    component = fixture.componentInstance;
    component.context = new ConfigureResourceContext('resource');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return auto for style.overflow when height is bigger than min = 50 ', fakeAsync(() => {
    component.project = testDataService.aProject();
    heightChangeService.height.next(70);
    fixture.detectChanges();

    const debugElement = fixture.debugElement.query(
      By.css('#configure-resource-div')
    );
    expect(debugElement).toBeTruthy();
    const style = debugElement.nativeElement.style;
    expect(style).toBeTruthy();
    expect(style.overflow).toContain('auto');
  }));

  it('should return empty for style.overflow when height is smaller than min = 50 ', fakeAsync(() => {
    component.project = testDataService.aProject();
    heightChangeService.height.next(30);
    fixture.detectChanges();
    const debugElement = fixture.debugElement.query(
      By.css('#configure-resource-div')
    );
    expect(debugElement).toBeTruthy();
    const style = debugElement.nativeElement.style;
    expect(style).toBeTruthy();
    expect(style.overflow).toContain('');
  }));

  it('should subscribe to context and call detect changes', function () {
    component.subscribeToContext();
    propertiesPanelService.context$.next(
      testDataService.dummyBlockPropertiesContext
    );
    expect(component.context).toBe(testDataService.dummyBlockPropertiesContext);
  });

  it('should close the properties panel when destroying it', () => {
    component.context = ConfigureResourceContext;

    let componentType;
    propertiesPanelService.component$.subscribe(
      (value) => (componentType = value)
    );
    component.ngOnDestroy();

    expect(componentType).toStrictEqual(EmptyPropertiesPanelComponent);
  });
});
