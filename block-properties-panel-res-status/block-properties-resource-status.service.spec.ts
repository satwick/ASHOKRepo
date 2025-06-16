import { TestBed } from '@angular/core/testing';

import { BlockPropertiesResourceStatusService } from 'app/core/components/block-properties-components/block-properties-panel-res-status/block-properties-resource-status.service';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('BlockPropertiesResourceStatusService', () => {
  let service: BlockPropertiesResourceStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] });
    service = TestBed.inject(BlockPropertiesResourceStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return the value selected if one of the buttons is selected', function () {
    expect(service.calculateStateForResource('', '', 'any', 'any')).toBe('any');
  });

  it('should return the value selected if one of the buttons is selected', function () {
    expect(service.calculateStateForResource('', '', 'unique', 'unique')).toBe(
      'unique'
    );
  });

  it('should return the value selected if one of the buttons is selected', function () {
    expect(
      service.calculateStateForResource('', '1;15', 'value', 'Value')
    ).toBe('1;15');
  });

  it('should return the value selected if one of the buttons is selected', function () {
    expect(
      service.calculateStateForResource('', 'ATOM;TOM', 'value', 'Value')
    ).toBe('ATOM;TOM');
  });

  it('should return the value selected if one of the buttons is selected', function () {
    expect(
      service.calculateStateForResource('GTM-OUT(1)', '', '', 'Reference')
    ).toBe('GTM-OUT(1)');
  });
});
