import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { BlockPropertiesContext } from 'app/core/components/properties-panel/models/block-properties-context.model';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Event, NavigationEnd, Router } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ModulePropertyTab } from 'app/core/enums/tab.enum';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { TranslateModule } from '@ngx-translate/core';
import { BlockInterfacesToMicrocontrollerTabComponent } from '../block-interfaces-to-microcontroller-tab/block-interfaces-to-microcontroller-tab.component';
import { BlockGeneralTabComponent } from '../block-general-tab/block-general-tab.component';
import { TabViewModule } from 'primeng/tabview';
import { NgClass } from '@angular/common';
import { AssignmentUtils } from 'app/core/services/search/assignment.util';
import {
  DisplayDesignObjectMenuService
} from "../../../../features/design-object-menu/design-object-menu/display-design-object-menu.service";

@Component({
  selector: 'app-block-properties-panel',
  templateUrl: './block-properties-panel.component.html',
  styleUrls: ['./block-properties-panel.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    TabViewModule,
    BlockGeneralTabComponent,
    BlockInterfacesToMicrocontrollerTabComponent,
    TranslateModule,
    NgClass,
  ],
})
export class BlockPropertiesPanelComponent implements OnInit, OnDestroy {
  activeIndexPropertiesPanel = 0;
  context?: BlockPropertiesContext;
  blockPropertyTab = ModulePropertyTab;
  selectedObjectName: string | undefined;
  assignmentUtils = AssignmentUtils;

  private notifier: Subject<void> = new Subject<void>();

  constructor(
    public panelService: PropertiesPanelService,
    private blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService,
    private detectionChange: ChangeDetectorRef,
    private router: Router,
    private blockDiagramHighlightService: BlockDiagramHighlightService,
    private displayDesignObjectMenuService: DisplayDesignObjectMenuService
  ) {}

  ngOnInit(): void {
    this.listenToContextChange();
    this.listenToTabChange();
    this.listenToRouterEvents();
    this.listenToSelectionInPropertiesPanel();
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  private listenToRouterEvents() {
    this.router.events
      .pipe(takeUntil(this.notifier))
      .subscribe((event: Event) => {
        if (event instanceof NavigationEnd) {
          this.panelService.pushNewProperties('');
        }
      });
  }

  private listenToTabChange() {
    this.blockPropertiesInterfaceContextService.modulePropertiesPanelTabChange
      .pipe(takeUntil(this.notifier))
      .subscribe((activeIndex) => {
        this.activeIndexPropertiesPanel = activeIndex;
      });
  }

  private listenToContextChange() {
    this.panelService.context$
      .pipe(
        map((context) => {
          return context as BlockPropertiesContext;
        }),
        takeUntil(this.notifier)
      )
      .subscribe((context) => {
        this.context = context;
        this.blockPropertiesInterfaceContextService.functionModuleChange.next(
          context.designObject
        );
        this.detectionChange.detectChanges();
      });
  }

  getSelectedObjectName(): string | undefined {
    if (this.selectedObjectName) {
      return this.selectedObjectName;
    }
    return this.assignmentUtils.getCombinedName(this.context?.designObject);
  }

  listenToSelectionInPropertiesPanel() {
    this.blockDiagramHighlightService.selection
      .pipe(takeUntil(this.notifier))
      .subscribe((value) => {
        this.selectedObjectName = value;
      });
  }

  changeTab(tabIndex: number): void {
    this.blockPropertiesInterfaceContextService.modulePropertiesPanelTabChange.next(
      tabIndex
    );
  }
}
