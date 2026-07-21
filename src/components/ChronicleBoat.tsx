export type BoatSkin = 'paper' | 'chalk' | 'ship' | 'ship-close' | 'final'

const boatAsset = (file: string) =>
  `${import.meta.env.BASE_URL}assets/boats/${file}`

const skins: Record<BoatSkin, { body: string }> = {
  paper: { body: boatAsset('paper-boat.png') },
  chalk: { body: boatAsset('chalk-boat.png') },
  ship: { body: boatAsset('ship.png') },
  'ship-close': { body: boatAsset('ship.png') },
  final: { body: boatAsset('paper-boat.png') },
}

export function ChronicleBoat() {
  return (
    <div className="chronicle-boat-viewport" aria-hidden="true">
      <div className="chronicle-boat">
        {(Object.entries(skins) as [BoatSkin, (typeof skins)[BoatSkin]][]).map(
          ([skin, assets]) => (
            <div
              className={`chronicle-boat__skin chronicle-boat__skin--${skin}`}
              data-boat-skin={skin}
              key={skin}
            >
              <div className="chronicle-boat__bob">
                <img
                  className="chronicle-boat__body"
                  src={assets.body}
                  alt=""
                  draggable={false}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
