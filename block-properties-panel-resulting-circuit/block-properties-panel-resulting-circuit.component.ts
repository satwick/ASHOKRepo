import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ResultingCircuitContext } from 'app/core/components/properties-panel/models/resulting-circuit-context.model';
import { Subject } from 'rxjs';
import { PropertiesPanelService } from 'app/core/services/properties-panel.service';
import { map, takeUntil } from 'rxjs/operators';
import { BlockPropertiesInterfaceContextService } from 'app/core/components/block-properties-components/block-properties-interface-context.service';
import { Event, NavigationEnd, Router } from '@angular/router';
import { BlockDiagramHighlightService } from 'app/features/block-diagram/services/block-diagram-highlight.service';
import { CircuitPropertyTab } from 'app/core/enums/tab.enum';
import { TranslateModule } from '@ngx-translate/core';
import { BlockPropertiesPinReservationTabComponent } from '../block-properties-pin-reservation-tab/block-properties-pin-reservation-tab.component';
import { BlockResultingCircuitTabComponent } from '../block-resulting-circuit-tab/block-resulting-circuit-tab.component';
import { TabViewModule } from 'primeng/tabview';
import { NgIf } from '@angular/common';
import { NodeModel } from 'app/core/models/dynamic-attributes/node.model';

@Component({
    selector: 'app-block-properties-panel-resulting-circuit',
    templateUrl: './block-properties-panel-resulting-circuit.component.html',
    styleUrls: ['./block-properties-panel-resulting-circuit.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        NgIf,
        TabViewModule,
        BlockResultingCircuitTabComponent,
        BlockPropertiesPinReservationTabComponent,
        TranslateModule,
    ],
})
export class BlockPropertiesPanelResultingCircuitComponent
  implements OnInit, OnDestroy
{
  resultingCircuit?: NodeModel;
  context: ResultingCircuitContext;
  selectedObjectName: string | undefined;
  blockPropertyTab = CircuitPropertyTab;
  activeIndexPropertiesPanel = 0;

  private notifier = new Subject<void>();

  constructor(
    private panelService: PropertiesPanelService,
    private blockPropertiesInterfaceContextService: BlockPropertiesInterfaceContextService,
    private detectionChange: ChangeDetectorRef,
    private router: Router,
    private blockDiagramHighlightService: BlockDiagramHighlightService
  ) {
    this.context = {
      name: '',
      designObject: new NodeModel(0, ''),
    };
  }

  ngOnInit(): void {
    this.subscribeToContext();
    this.listenToTabChange();
    this.listenToRouterEvents();
    this.subscribeToCircuitChange();
    this.listenToSelectionInPropertiesPanel();
  }

  ngOnDestroy(): void {
    this.notifier.next();
    this.notifier.complete();
  }

  subscribeToContext() {
    this.panelService.context$
      .pipe(
        map((context) => context as ResultingCircuitContext),
        takeUntil(this.notifier)
      )
      .subscribe((context) => {
        this.context = context;
        this.blockPropertiesInterfaceContextService.resultingCircuitChange.next(
          context.designObject
        );
        this.detectionChange.detectChanges();
      });
  }

  private listenToTabChange() {
    this.blockPropertiesInterfaceContextService.circuitPropertiesPanelTabChange
      .pipe(takeUntil(this.notifier))
      .subscribe((activeIndex) => {
        this.activeIndexPropertiesPanel = activeIndex;
      });
  }

  listenToSelectionInPropertiesPanel() {
    this.blockDiagramHighlightService.selection
      .pipe(takeUntil(this.notifier))
      .subscribe((value) => {
        this.selectedObjectName = value;
      });
  }
  changeTab(tabIndex: number): void {
    this.blockPropertiesInterfaceContextService.circuitPropertiesPanelTabChange.next(
      tabIndex
    );
  }

  private subscribeToCircuitChange() {
    this.blockPropertiesInterfaceContextService.resultingCircuitChange
      .pipe(takeUntil(this.notifier))
      .subscribe((resultingCircuit) => {
        this.resultingCircuit = resultingCircuit;
      });
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
}
