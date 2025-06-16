import { Injectable } from '@angular/core';
import { AttributeSetting } from 'app/core/components/block-properties-components/translation.model';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BlockPropertiesResourceStatusService {
  enableReset = false;
  resetSection = new Subject<boolean>();

  calculateStateForResource(
    referenceState: string,
    priorityState: string,
    state: string,
    button: string
  ): string | undefined {
    if (
      referenceState !== '' &&
      button.toLowerCase() === AttributeSetting.reference
    ) {
      return referenceState;
    }
    if (state === 'unique' || state == 'any') {
      return state;
    }
    if (priorityState !== '') {
      return priorityState;
    }
    return undefined;
  }
}
