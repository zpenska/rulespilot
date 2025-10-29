import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import type { Rule, RuleGroup } from '../../types/rules'

const RULES_COLLECTION = 'rules'
const RULE_GROUPS_COLLECTION = 'ruleGroups'

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Convert Rule data from Firestore
const convertFirestoreRule = (id: string, data: DocumentData): Rule => ({
  id,
  code: data.code || '',
  ruleDesc: data.ruleDesc || data.ruleName || '', // Migration: use ruleName if ruleDesc not present
  ruleType: data.ruleType || 'rules',
  standardFieldCriteria: data.standardFieldCriteria || [],
  customFieldCriteria: data.customFieldCriteria || [],
  weight: data.weight,
  activationDate: data.activationDate,
  status: data.status || 'inactive',
  category: data.category,
  createdAt: timestampToDate(data.createdAt).toISOString(),
  updatedAt: timestampToDate(data.updatedAt).toISOString(),
})

// Rules CRUD operations
export const rulesService = {
  // Create a new rule
  async createRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    const docRef = await addDoc(collection(db, RULES_COLLECTION), {
      ...rule,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docSnap = await getDoc(docRef)
    return convertFirestoreRule(docRef.id, docSnap.data()!)
  },

  // Get all rules
  async getAllRules(): Promise<Rule[]> {
    const q = query(collection(db, RULES_COLLECTION), orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => convertFirestoreRule(doc.id, doc.data()))
  },

  // Get rule by ID
  async getRule(id: string): Promise<Rule | null> {
    const docRef = doc(db, RULES_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return convertFirestoreRule(docSnap.id, docSnap.data())
  },

  // Update rule
  async updateRule(id: string, updates: Partial<Rule>): Promise<void> {
    const docRef = doc(db, RULES_COLLECTION, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    })
  },

  // Delete rule
  async deleteRule(id: string): Promise<void> {
    const docRef = doc(db, RULES_COLLECTION, id)
    await deleteDoc(docRef)
  },

  // Get enabled rules only
  async getEnabledRules(): Promise<Rule[]> {
    const q = query(
      collection(db, RULES_COLLECTION),
      where('enabled', '==', true),
      orderBy('updatedAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => convertFirestoreRule(doc.id, doc.data()))
  },
}

// Rule Groups CRUD operations
export const ruleGroupsService = {
  // Create a new rule group
  async createRuleGroup(group: Omit<RuleGroup, 'id'>): Promise<RuleGroup> {
    const docRef = await addDoc(collection(db, RULE_GROUPS_COLLECTION), group)
    const docSnap = await getDoc(docRef)
    return { id: docRef.id, ...docSnap.data() } as RuleGroup
  },

  // Get all rule groups
  async getAllRuleGroups(): Promise<RuleGroup[]> {
    const querySnapshot = await getDocs(collection(db, RULE_GROUPS_COLLECTION))
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RuleGroup))
  },

  // Get rule group by ID
  async getRuleGroup(id: string): Promise<RuleGroup | null> {
    const docRef = doc(db, RULE_GROUPS_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return { id: docSnap.id, ...docSnap.data() } as RuleGroup
  },

  // Update rule group
  async updateRuleGroup(id: string, updates: Partial<RuleGroup>): Promise<void> {
    const docRef = doc(db, RULE_GROUPS_COLLECTION, id)
    await updateDoc(docRef, updates)
  },

  // Delete rule group
  async deleteRuleGroup(id: string): Promise<void> {
    const docRef = doc(db, RULE_GROUPS_COLLECTION, id)
    await deleteDoc(docRef)
  },
}
