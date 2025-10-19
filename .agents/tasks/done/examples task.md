---
name: Pagination of Gas Station Data
status: in-progress
created: October 5, 2025 2:20 PM
updated: October 6, 2025 2:45 PM
---
## Relevant Files
- `apps/mobile/src/app/(tabs)/home.tsx` - Existing home screen; strip heavy logic once hooks and components are extracted.
- `apps/mobile/src/features/fuel-prices/hooks/useStationCards.ts` - New hook returning normalized station cards.
- `apps/mobile/src/features/fuel-prices/hooks/useFilteredStations.ts` - New hook applying search, sort, fuel, and price filters.
- `apps/mobile/src/features/fuel-prices/constants.ts` - Central home for fuel price constants, sort options, and shared color tokens.
- `apps/mobile/src/components/StationCard.tsx` - Presentational component rendering a single station card.
- `apps/mobile/src/components/FuelFiltersPanel.tsx` - Presentational component for the filter sheet.
- `apps/mobile/src/components/FuelSortModal.tsx` - Presentational component for sort modal interactions.
- `apps/mobile/src/components/__tests__/StationCard.test.tsx` - Unit tests covering the extracted station card component (create as needed).

### Notes
- Implement the refactor before resuming pagination development to avoid duplication and simplify future diffs.
- Keep the hooks folder structure under `apps/mobile/src/features/fuel-prices/hooks/` per project convention.
- Reuse centralized constants instead of inline literals when updating downstream files.
- Update or add tests alongside each new component/hook to preserve coverage.

# 1.0 Shape Station Data with Dedicated Hooks

## Description
Move the useMemo-derived station transformation logic from `apps/mobile/src/app/(tabs)/home.tsx` into feature-level hooks so the screen focuses on composition and pagination layering.

## Sub tasks
- [x] 1.1 Create `useStationCards` hook.
  - Extract the data normalization block currently at lines ~77–123 into `apps/mobile/src/features/fuel-prices/hooks/useStationCards.ts`, returning memoized station cards and related metadata.
- [x] 1.2 Create `useFilteredStations` hook.
  - Lift the filtering/sorting memo that lives at lines ~126–159 into `apps/mobile/src/features/fuel-prices/hooks/useFilteredStations.ts`, parameterized by the selected filters and sharing types with `useStationCards`.
- [x] 1.3 Wire hooks into `HomeScreen`.
  - Replace inline memo usage with the new hooks and ensure type imports align with existing fuel price types.

# 2.0 Extract Presentational Components

## Description
Split bulky UI blocks into dedicated presentational components under `apps/mobile/src/components/` while preserving props for future pagination enhancements.

## Sub tasks
- [x] 2.1 Create `StationCard` component.
  - Move the JSX from `renderStationCard` (~lines 205–308) into `apps/mobile/src/components/StationCard.tsx`, expose clear props, and update `HomeScreen` usage.
- [x] 2.2 Extract filters panel.
  - Lift the filter sheet JSX (~lines 455–555) into `FuelFiltersPanel.tsx`, passing down handlers and state as props.
- [x] 2.3 Extract sort modal.
  - Relocate the sort modal block (~lines 562–640) into `FuelSortModal.tsx`, ensuring event and styling props remain controlled by the screen.

# 3.0 Centralize Constants and Styles

## Description
Consolidate repeated config values and inline styles into a shared constants module and StyleSheet definitions to reduce duplication and clarify design tokens.

## Sub tasks
- [x] 3.1 Move static config into `constants.ts`.
  - Relocate `FUEL_TYPES`, `SORT_OPTIONS`, color tokens, and any other static literals into `apps/mobile/src/features/fuel-prices/constants.ts` and export them for reuse.
- [x] 3.2 Create StyleSheet for common styles.
  - Replace inline style objects across extracted components and `HomeScreen` with `StyleSheet.create` definitions, reusing tokens from the constants module.
- [x] 3.3 Update imports across components.
  - Ensure `HomeScreen`, `StationCard`, `FuelFiltersPanel`, and `FuelSortModal` consume the centralized constants and styles.

# 4.0 Maintain Test Coverage

## Description
Add or update tests to validate the refactored hooks and components, confirming behavior remains unchanged before pagination work resumes.

## Sub tasks
- [x] 4.1 Add hook tests.
  - Create tests for `useStationCards` and `useFilteredStations`, focusing on data normalization and filter logic edge cases.
- [x] 4.2 Add component tests.
  - Write tests for `StationCard`, `FuelFiltersPanel`, and `FuelSortModal` to ensure rendering matches previous expectations and props drive behavior correctly.
- [x] 4.3 Verify existing integration paths.
  - Run relevant test suites (`npx jest`) and update snapshots if necessary, documenting any required adjustments.

# 5.0 Cleanup and Documentation

## Description
Finalize the refactor by removing unused code, updating docs, and confirming that pagination follow-up tasks can proceed without conflicts.

## Sub tasks
- [x] 5.1 Delete orphaned functions and styles.
  - Remove the old inline helpers and ensure no dead code remains in `HomeScreen` after extractions.
- [x] 5.2 Update developer guidance.
  - Document the new hooks folder convention, component locations, and constants module in `apps/mobile/AGENTS.md` or other relevant onboarding docs.
- [x] 5.3 Review for pagination readiness.
  - Confirm the screen now consumes the extracted primitives cleanly and note any gaps that the upcoming pagination work should consider.

# 6.0 Implement Client-Side Pagination

## Description
Add pagination logic to display 5 stations initially, with load-more functionality revealing 10 additional stations per interaction.

## Sub tasks
- [x] 6.1 Create `usePagination` hook.
  - Build hook accepting `{ items, initialLimit: 5, pageSize: 10 }` and returning `{ visibleItems, hasMore, loadMore, reset }`.
- [x] 6.2 Integrate pagination into `HomeScreen`.
  - Wire `usePagination` to `filteredStations` and render `visibleItems` instead of full list.
- [x] 6.3 Add "Load More" button.
  - Render button below station list when `hasMore === true`, calling `loadMore` on press.
- [x] 6.4 Add infinite scroll support.
  - Detect scroll-to-bottom in ScrollView and trigger `loadMore` automatically.
- [x] 6.5 Reset pagination on filter changes.
  - Call `reset()` whenever `searchQuery`, `sortBy`, `selectedFuelType`, or `priceRange` changes.
- [x] 6.6 Write tests for `usePagination` hook.
  - Test initial limit, page size increments, hasMore logic, and reset behavior.
- [x] 6.7 Verify pagination behavior.
  - Test manual load-more, infinite scroll, and filter reset scenarios.

# PM Modifications

- [x] Remove infinite scroll support so additional stations only appear when the user taps the load-more button. (Update `apps/mobile/src/app/(tabs)/home.tsx`)
- [x] Cap the visible station list to five entries regardless of load-more interactions. (Update `apps/mobile/src/app/(tabs)/home.tsx` and adjust pagination usage in `apps/mobile/src/features/fuel-prices/hooks/usePagination.ts` if needed)
- [x] Remove pull-to-refresh behavior from the stations view. (Update `apps/mobile/src/app/(tabs)/home.tsx`)
- [x] Surface a top info bar displaying `LAST_UPDATED_PRICES` from the environment. (Read from `apps/mobile/.env`; render in `apps/mobile/src/app/(tabs)/home.tsx`)
- [x] Add a clear (`X`) affordance to the search bar that resets the query when tapped. (Update `apps/mobile/src/app/(tabs)/home.tsx`)
- [x] Rename the screen header text from "Gas Prices" to "Fresh Gas". (Update `apps/mobile/src/app/(tabs)/home.tsx`)