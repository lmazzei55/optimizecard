'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardRecommendation } from '@/lib/recommendation-engine'
import { RecommendationItem } from '@/components/RecommendationItem'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/Header'
import { CardCustomizationModal } from '@/components/CardCustomizationModal'
import { useState as useStateReact } from 'react'

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<CardRecommendation[]>([])
  const [sortKey, setSortKey] = useState<'name' | 'value'>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'cashback' | 'points'>('all')
  const [editingCardId, setEditingCardId] = useState<string|null>(null)
  const [cardCustomizations, setCardCustomizations] = useState<Record<string, any>>({})

  // read saved payload
  useEffect(() => {
    const payloadRaw = localStorage.getItem('cc-recommendation-input')
    if (!payloadRaw) {
      router.replace('/')
      return
    }
    const payload = JSON.parse(payloadRaw)
    ;(async () => {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSpending: payload.userSpending || [],
            rewardPreference: payload.rewardPreference || 'cashback',
            pointValue: 0.01,
            cardCustomizations: payload.cardCustomizations || {}
          })
        })
        const data = await res.json()
        setRecommendations(data)
        setCardCustomizations(payload.cardCustomizations || {})
      } catch (err) {
        console.error('Failed to load recs', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const processed = recommendations
    .filter(r => filterType === 'all' || r.rewardType === filterType)
    .sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.cardName.localeCompare(b.cardName) : b.cardName.localeCompare(a.cardName)
      }
      return sortDir === 'asc' ? a.netAnnualValue - b.netAnnualValue : b.netAnnualValue - a.netAnnualValue
    })

  const openCustomization = (id:string) => setEditingCardId(id)
  const closeCustomization = () => setEditingCardId(null)

  const handleSaveCustomization = (cust: any) => {
    if (!editingCardId) return;
    const updated = {...cardCustomizations, [editingCardId]: cust};
    setCardCustomizations(updated);
    localStorage.setItem('cc-card-custom', JSON.stringify(updated));
    // refetch recommendations
    setLoading(true);
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userSpending: JSON.parse(localStorage.getItem('cc-recommendation-input') || '{}').userSpending || [],
        rewardPreference: JSON.parse(localStorage.getItem('cc-recommendation-input') || '{}').rewardPreference || 'cashback',
        pointValue: 0.01,
        cardCustomizations: updated
      })
    }).then(r => r.json()).then(d => setRecommendations(d)).finally(() => setLoading(false));
    closeCustomization();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <p className="text-lg">Loading your recommendations…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Mini banner to edit search */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-semibold">Your Recommendations</h1>
            <p className="text-sm text-white/80">{recommendations.length} cards ranked by net annual value</p>
          </div>
          <Button
            variant="outline"
            className="bg-white text-blue-700 hover:bg-gray-100"
            onClick={() => router.push('/dashboard')}
          >
            ✏️ Edit Spending
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-x-2 text-sm">
            <span>Filter:</span>
            {['all','cashback','points'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={`px-3 py-1 rounded-full border ${filterType===t?'bg-blue-600 text-white':'border-gray-300 text-gray-600'}`}
              >
                {t==='all'? 'All': t==='cashback'? 'Cashback':'Points'}
              </button>
            ))}
          </div>
          <div className="space-x-2 ml-auto text-sm">
            <span>Sort by:</span>
            <button
              onClick={() => {
                setSortKey('value'); setSortDir(prev=> prev==='asc'?'desc':'asc')
              }}
              className="px-3 py-1 rounded-full border border-gray-300"
            >
              Net Value {sortKey==='value' ? (sortDir==='asc'?'↑':'↓'):''}
            </button>
            <button
              onClick={() => {setSortKey('name'); setSortDir(prev=> prev==='asc'?'desc':'asc')}}
              className="px-3 py-1 rounded-full border border-gray-300"
            >
              Name {sortKey==='name' ? (sortDir==='asc'?'↑':'↓'):''}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {processed.map((rec, idx) => (
            <RecommendationItem
              key={rec.cardId}
              recommendation={rec}
              rank={idx}
              onCustomize={() => openCustomization(rec.cardId)}
            />
          ))}
        </div>
      </div>

      {editingCardId && (
        <CardCustomizationModal
          isOpen={true}
          onClose={closeCustomization}
          onSave={handleSaveCustomization}
          card={{
            id: editingCardId,
            name: processed.find(r=>r.cardId===editingCardId)?.cardName||'',
            type: processed.find(r=>r.cardId===editingCardId)?.rewardType||'cashback',
            benefits: processed.find(r=>r.cardId===editingCardId)?.benefitsBreakdown.map(b=>({id:b.benefitName,name:b.benefitName,value:b.officialValue}))||[]
          }}
          currentCustomization={cardCustomizations[editingCardId]}
        />
      )}
    </>
  )
} 