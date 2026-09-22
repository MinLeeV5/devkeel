import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

import type { PageId } from '../routes'

export type PageComponent = LazyExoticComponent<ComponentType>

export const PAGE_COMPONENTS: Record<PageId, PageComponent> = {
  'changelog': lazy(() => import('./changelog').then((module) => ({ default: module.ChangelogPage }))),
  'home': lazy(() => import('./home').then((module) => ({ default: module.HomePage }))),
  'v1-architecture': lazy(() => import('./v1-architecture').then((module) => ({ default: module.V1ArchitecturePage }))),
  'v1-best-practices': lazy(() => import('./v1-best-practices').then((module) => ({ default: module.V1BestPracticesPage }))),
  'v1-capability-inventory': lazy(() => import('./v1-capability-inventory').then((module) => ({ default: module.V1CapabilityInventoryPage }))),
  'v1-home': lazy(() => import('./v1-home').then((module) => ({ default: module.V1HomePage }))),
  'v1-workflow': lazy(() => import('./v1-workflow').then((module) => ({ default: module.V1WorkflowPage }))),
}
