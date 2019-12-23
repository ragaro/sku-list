import React, { useMemo, useState, Fragment } from 'react'
import HtmlParser from 'react-html-parser'
import { FormattedMessage } from 'react-intl'
import { useCssHandles } from 'vtex.css-handles'

import { Variations, InitialSelectionType, DisplayMode, Item, Variation } from '../typings'
import { useDevice } from 'vtex.device-detector'
import { useSku } from './SkuContext'
import GradientCollapse from 'vtex.store-components/GradientCollapse'

const CSS_HANDLES = [
  'specificationsTableContainer',
  'specificationsTabsContainer',
  'specificationsTitle',
  'specificationsTable',
  'specificationsTab',
  'specificationsTablePropertyHeading',
  'specificationsTableSpecificationHeading',
  'specificationItemProperty',
  'specificationItemSpecifications',
]

const useVariations = (skuItems: Item[], shouldNotShow: boolean, visibleVariations?: string[]) => {
  const result = useMemo(() => {
    if (shouldNotShow || visibleVariations && visibleVariations.length === 0) {
      return {}
    }
    const variations: Variations = {}
    const variationsSet: Record<string, Set<string>> = {}
    if (visibleVariations) {
      visibleVariations = visibleVariations.map(variation => variation.toLowerCase().trim())
    }

    for (const skuItem of skuItems) {
      for (const currentVariation of skuItem.variations) {
        const { name, values } = currentVariation
        if (!visibleVariations || visibleVariations.includes(name.toLowerCase().trim())) {

          const value = values[0]
          const currentSet = variationsSet[name] || new Set()
          currentSet.add(value)
          variationsSet[name] = currentSet
        }
      }
    }
    const variationsNames = Object.keys(variationsSet)
    // Transform set back to array
    for (const variationName of variationsNames) {
      const set = variationsSet[variationName]
      variations[variationName] = Array.from(set)
    }
    return variations
  }, [skuItems, shouldNotShow])
  return result
}

interface Props {
  skuItems: Item[]
  skuSelected: Item
  onSKUSelected?: (skuId: string) => void
  maxItems?: number
  seeMoreLabel: string
  hideImpossibleCombinations?: boolean
  showValueNameForImageVariation?: boolean
  imageHeight?: number | object
  imageWidth?: number | object
  thumbnailImage?: string
  visibleVariations?: string[]
  showVariationsLabels?: boolean
  variationsSpacing?: number
  showVariationsErrorMessage?: boolean
  initialSelection?: InitialSelectionType
  displayMode?: DisplayMode
  collapsible: string
}

const SKUSelectorWrapper: StorefrontFunctionComponent<Props> = props => {
  const valuesFromContext = useSku()

  const { isMobile } = useDevice()

  const skuSelected =
    props.skuSelected != null
      ? props.skuSelected
      : valuesFromContext.sku

  const skuItems = [skuSelected]

  const shouldNotShow =
    skuItems.length === 0 ||
    !skuSelected?.variations ||
    skuSelected.variations.length === 0

  const variations = useVariations(skuItems, shouldNotShow, props.visibleVariations)

  const handles = useCssHandles(CSS_HANDLES)

  const [collapsed, setCollapsed] = useState(true)

  if (shouldNotShow || !skuSelected) {
    return null
  }

  const toVariationArray = (variations: Variations) => {
    let result: Variation[] = []
    const variationNames = Object.keys(variations)
    for (const variationName of variationNames) {
      result = [...result, { name: variationName, values: variations[variationName] }]
    }
    return result
  }

  const specifications: Variation[] = toVariationArray(variations)

  const specificationsTable = (
    <table
      className={`${handles.specificationsTable} w-100 bg-base border-collapse`}
    >
      <thead>
      <tr>
        <th
          className={`${handles.specificationsTablePropertyHeading} w-50 b--muted-4 bb bt c-muted-2 t-body tl pa5`}
        >
          <FormattedMessage id="store/product-description.property" />
        </th>
        <th
          className={`${handles.specificationsTableSpecificationHeading} w-50 b--muted-4 bb bt c-muted-2 t-body tl pa5`}
        >
          <FormattedMessage id="store/product-description.specification" />
        </th>
      </tr>
      </thead>
      <tbody>
      {specifications.map((specification: Variation, i: number) => (
        <tr key={i}>
          <td
            className={`${handles.specificationItemProperty} w-50 b--muted-4 bb pa5`}
          >
            {HtmlParser(specification.name)}
          </td>
          <td
            className={`${handles.specificationItemSpecifications} w-50 b--muted-4 bb pa5`}
          >
            {HtmlParser(specification.values.join(', '))}
          </td>
        </tr>
      ))}
      </tbody>
    </table>
  )

  const collapsible = props.collapsible || 'always'

  const shouldBeCollapsible = Boolean(
    collapsible === 'always' ||
    (collapsible === 'mobileOnly' && isMobile) ||
    (collapsible === 'desktopOnly' && !isMobile)
  )

  const specificationTitle = (
    <FormattedMessage id="store/specifications.title">
      {(txt) => (
        <h2 className={`${handles.specificationsTitle} t-heading-5 mb5 mt0`}>
          {HtmlParser(txt as string)}
        </h2>
      )}
    </FormattedMessage>
  )

  const tableView = (
    <Fragment>
      {specifications.length > 0 && (
        <div
          className={`${handles.specificationsTableContainer} mt9 mt0-l pl8-l`}
        >
          {specificationTitle}
          {shouldBeCollapsible ? (
            <GradientCollapse
              collapseHeight={220}
              collapsed={collapsed}
              onCollapsedChange={(_: any, newValue: boolean) => setCollapsed(newValue)}
            >
              {specificationsTable}
            </GradientCollapse>
          ) : (
            specificationsTable
          )}
        </div>
      )}
    </Fragment>
  )

  return tableView
}

SKUSelectorWrapper.schema = {
  title: 'admin/editor.skuSelector.title',
  description: 'admin/editor.skuSelector.description',
}

export default SKUSelectorWrapper
