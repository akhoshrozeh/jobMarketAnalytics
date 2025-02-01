'use server'

import { CheckIcon } from '@heroicons/react/20/solid'
import { verifyIdToken } from '@/utils/verifyAccessToken'
import { Stripe } from 'stripe';
import { Resource } from 'sst';

const stripeSecretKey = Resource.STRIPE_SECRET_KEY.value;
const stripe = new Stripe(stripeSecretKey)
const basicPriceId = Resource.BasicMembershipPriceId.value;
const premiumPriceId = Resource.PremiumMembershipPriceId.value;


const tiers = [
  {
    name: 'Standard Lifetime Membership',
    id: 'tier-standard',
    href: '',
    originalPrice: "$79.99",
    price: "$39.99",
    description: 'This plan will provide a strong insight into your journey.',
    features: [
      '25 products',
      'Up to 10,000 subscribers',
      'Advanced analytics',
      '24-hour support response time',
      'Marketing automations',
    ],
    mostPopular: false,
  },
  {
    name: 'Premium Lifetime Membership',
    id: 'tier-premium',
    href: '',
    originalPrice: "$139.99",
    price: "$69.99",
    description: 'Unlimited and full access to analytics and support for journey.',
    features: [
      'Unlimited access to all features',
      'Unlimited subscribers',
      'Advanced analytics',
      '1-hour, dedicated support response time',
      'Marketing automations',
      'Custom reporting tools',
      'Custom analytics requests',
    ],
    mostPopular: true,
  },
]

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

export default async function Pricing() {

  // Returns null if invalid token or dne
  const idToken = await verifyIdToken();
  console.log("idToken: ", idToken)

  if (idToken) {
      const basicPaymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: basicPriceId,
            quantity: 1,
          },
        ],
        metadata: {
          metadata_email: String(idToken?.email),
          metadata_username: String(idToken?.sub)
        }
      });
    
      const premiumPaymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price: premiumPriceId,
            quantity: 1
          }
        ],
        metadata: {
          metadata_email: String(idToken?.email),
          metadata_username: String(idToken?.sub)
        }
        
      })

    tiers[0].href = basicPaymentLink.url + `?prefilled_email=${encodeURIComponent(String(idToken?.email))}`;
    tiers[1].href = premiumPaymentLink.url + `?prefilled_email=${encodeURIComponent(String(idToken?.email))}`;
  }

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold text-emerald-400">Pricing</h2>
          <p className="mt-2 text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            One-time payment, lifetime access
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-gray-200 sm:text-xl/8">
         No recurring payments. No subscriptions. No BS.
        </p>
        <div className="mt-8 mb-16 flex flex-col text-center justify-center text-4xl text-white">
          <p className="font-bold text-rose-500 mb-1 animate-pulse">🚨 EARLY BIRD OFFER 🚨 </p>
          50% off for the first 100 customers!
        </div>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:max-w-5xl lg:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'bg-emerald-300/10 ring-2 ring-emerald-500' : 'ring-1 ring-white/50',
                'relative rounded-3xl p-8 xl:p-10',
              )}
            >
              <div className="absolute -top-3 -right-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white text-xl font-bold">
                50%
              </div>
              <div className="flex items-center justify-center gap-x-4">
                <h3 id={tier.id} className="text-lg/8 font-semibold text-white">
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs/5 font-semibold text-white">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm/6 text-gray-300">{tier.description}</p>

              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-2xl font-semibold tracking-tight text-gray-400 line-through " style={{ textDecorationColor: 'red' }}>{tier.originalPrice}</span>
                {/* <span className="text-sm/6 font-semibold text-gray-300"></span> */}
              </p>

              <p className="mt-2 flex items-baseline gap-x-1">
                <span className="text-4xl font-semibold tracking-tight text-white">{tier.price}</span>
                {/* <span className="text-sm/6 font-semibold text-gray-300"></span> */}
              </p>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 focus-visible:outline-emerald-500'
                    : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white',
                  'mt-6 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                )}
              >
                Buy plan
              </a>
              <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-300 xl:mt-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-white" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
