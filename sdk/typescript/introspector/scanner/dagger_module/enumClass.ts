import ts from "typescript"

import { IntrospectionError } from "../../../common/errors/IntrospectionError.js"
import { AST } from "../typescript_module/ast.js"
import { DaggerEnumBase, DaggerEnumBaseValue } from "./enumBase.js"

export type DaggerEnumClasses = { [name: string]: DaggerEnumClass }

export type DaggerEnumValues = { [name: string]: DaggerEnumClassValue }

export class DaggerEnumClassValue implements DaggerEnumBaseValue {
  public name: string
  public value: string
  public description: string

  private symbol: ts.Symbol

  constructor(
    private readonly node: ts.PropertyDeclaration,
    private readonly ast: AST,
  ) {
    this.name = this.node.name.getText()
    this.symbol = this.ast.getSymbolOrThrow(this.node.name)
    this.description = this.ast.getDocFromSymbol(this.symbol)

    const initializer = this.node.initializer
    if (!initializer) {
      throw new Error("Dagger enum value has no value set")
    }

    this.value = this.ast.resolveParameterDefaultValue(initializer)
  }

  toJSON() {
    return {
      name: this.value,
      description: this.description,
    }
  }
}

export class DaggerEnumClass implements DaggerEnumBase {
  public name: string
  public description: string
  public values: DaggerEnumValues = {}

  private symbol: ts.Symbol

  constructor(
    private readonly node: ts.ClassDeclaration,
    private readonly ast: AST,
  ) {
    if (!this.node.name) {
      throw new IntrospectionError(
        `could not resolve name of enum at ${AST.getNodePosition(node)}.`,
      )
    }
    this.name = this.node.name.getText()
    this.symbol = this.ast.getSymbolOrThrow(this.node.name)
    this.description = this.ast.getDocFromSymbol(this.symbol)

    const properties = this.node.members
    for (const property of properties) {
      if (ts.isPropertyDeclaration(property)) {
        const value = new DaggerEnumClassValue(property, this.ast)

        this.values[value.name] = value
      }
    }
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      values: this.values,
    }
  }
}
